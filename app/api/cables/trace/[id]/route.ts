import { NextRequest } from "next/server";
import { eq, or, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { cables, interfaces, consolePorts, frontPorts, rearPorts } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

interface TraceStep {
    type: string;
    id: string;
    name: string;
    deviceName: string;
    cableLabel: string | null;
}

type TerminationType = "interface" | "frontPort" | "rearPort" | "consolePort";

async function getTerminationInfo(type: string, id: string): Promise<{ name: string; deviceName: string } | null> {
    if (type === "interface") {
        const iface = await db.query.interfaces.findFirst({
            where: eq(interfaces.id, id),
            with: { device: true },
        });
        return iface ? { name: iface.name, deviceName: iface.device.name } : null;
    }
    if (type === "consolePort") {
        const port = await db.query.consolePorts.findFirst({
            where: eq(consolePorts.id, id),
            with: { device: true },
        });
        return port ? { name: port.name, deviceName: port.device.name } : null;
    }
    if (type === "frontPort") {
        const port = await db.query.frontPorts.findFirst({
            where: eq(frontPorts.id, id),
            with: { device: true },
        });
        return port ? { name: port.name, deviceName: port.device.name } : null;
    }
    if (type === "rearPort") {
        const port = await db.query.rearPorts.findFirst({
            where: eq(rearPorts.id, id),
            with: { device: true },
        });
        return port ? { name: port.name, deviceName: port.device.name } : null;
    }
    return null;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { id: startId } = await context.params;
        const path: TraceStep[] = [];
        const visited = new Set<string>();

        let currentId = startId;
        let currentType: TerminationType | null = null;

        // Determine starting type by finding which table the id belongs to
        const ifaceCheck = await db.query.interfaces.findFirst({ where: eq(interfaces.id, startId) });
        if (ifaceCheck) currentType = "interface";
        if (!currentType) {
            const cpCheck = await db.query.consolePorts.findFirst({ where: eq(consolePorts.id, startId) });
            if (cpCheck) currentType = "consolePort";
        }
        if (!currentType) {
            const fpCheck = await db.query.frontPorts.findFirst({ where: eq(frontPorts.id, startId) });
            if (fpCheck) currentType = "frontPort";
        }
        if (!currentType) {
            const rpCheck = await db.query.rearPorts.findFirst({ where: eq(rearPorts.id, startId) });
            if (rpCheck) currentType = "rearPort";
        }

        if (!currentType) return errorResponse("Port not found", 404);

        // Add starting point
        const startInfo = await getTerminationInfo(currentType, currentId);
        if (startInfo) {
            path.push({
                type: currentType,
                id: currentId,
                name: startInfo.name,
                deviceName: startInfo.deviceName,
                cableLabel: null,
            });
        }

        // Trace the cable path (max 20 hops to prevent infinite loops)
        for (let i = 0; i < 20; i++) {
            const visitKey = `${currentType}:${currentId}`;
            if (visited.has(visitKey)) break;
            visited.add(visitKey);

            // Find cable connected to current termination
            const cable = await db.query.cables.findFirst({
                where: and(
                    isNull(cables.deletedAt),
                    or(
                        and(eq(cables.terminationAType, currentType), eq(cables.terminationAId, currentId)),
                        and(eq(cables.terminationBType, currentType), eq(cables.terminationBId, currentId)),
                    ),
                ),
            });

            if (!cable) break;

            // Get the other end
            let otherType: string;
            let otherId: string;
            if (cable.terminationAId === currentId && cable.terminationAType === currentType) {
                otherType = cable.terminationBType;
                otherId = cable.terminationBId;
            } else {
                otherType = cable.terminationAType;
                otherId = cable.terminationAId;
            }

            const otherInfo = await getTerminationInfo(otherType, otherId);
            if (otherInfo) {
                path.push({
                    type: otherType,
                    id: otherId,
                    name: otherInfo.name,
                    deviceName: otherInfo.deviceName,
                    cableLabel: cable.label,
                });
            }

            // If the other end is a frontPort, follow through to the linked rearPort
            if (otherType === "frontPort") {
                const fp = await db.query.frontPorts.findFirst({
                    where: eq(frontPorts.id, otherId),
                    with: { rearPort: { with: { device: true } } },
                });
                if (fp?.rearPort) {
                    path.push({
                        type: "rearPort",
                        id: fp.rearPort.id,
                        name: fp.rearPort.name,
                        deviceName: fp.rearPort.device.name,
                        cableLabel: null, // internal pass-through
                    });
                    currentType = "rearPort";
                    currentId = fp.rearPort.id;
                    continue;
                }
                break;
            }

            // If the other end is a rearPort, follow through to the linked frontPort
            if (otherType === "rearPort") {
                const rp = await db.query.rearPorts.findFirst({
                    where: eq(rearPorts.id, otherId),
                    with: { frontPorts: { with: { device: true } } },
                });
                if (rp?.frontPorts && rp.frontPorts.length > 0) {
                    const fp = rp.frontPorts[0];
                    path.push({
                        type: "frontPort",
                        id: fp.id,
                        name: fp.name,
                        deviceName: fp.device.name,
                        cableLabel: null, // internal pass-through
                    });
                    currentType = "frontPort";
                    currentId = fp.id;
                    continue;
                }
                break;
            }

            // interface or consolePort = endpoint, stop tracing
            break;
        }

        return successResponse(path);
    } catch (error) {
        return handleApiError(error);
    }
}
