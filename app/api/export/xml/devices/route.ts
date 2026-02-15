import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { auth } from "@/auth";
import { errorResponse, handleApiError } from "@/lib/api";
import { buildXml } from "@/lib/export/xml";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const result = await db.query.devices.findMany({
            where: isNull(devices.deletedAt),
            with: {
                deviceType: { with: { manufacturer: true } },
                rack: true,
                tenant: true,
                interfaces: true,
            },
        });

        const deviceNodes = result.map((dev) => ({
            "@_id": dev.id,
            "@_name": dev.name,
            "@_status": dev.status,
            "@_serialNumber": dev.serialNumber ?? "",
            "@_assetTag": dev.assetTag ?? "",
            type: {
                "@_model": dev.deviceType.model,
                "@_manufacturer": dev.deviceType.manufacturer.name,
                "@_uHeight": dev.deviceType.uHeight,
            },
            rack: dev.rack ? {
                "@_name": dev.rack.name,
                "@_position": dev.position ?? "",
            } : undefined,
            tenant: dev.tenant ? {
                "@_name": dev.tenant.name,
            } : undefined,
            interfaces: {
                interface: dev.interfaces.map((iface) => ({
                    "@_name": iface.name,
                    "@_type": iface.interfaceType,
                    "@_enabled": iface.enabled,
                })),
            },
        }));

        const xml = buildXml({ device: deviceNodes }, "dcim");

        return new Response(xml, {
            headers: {
                "Content-Type": "application/xml",
                "Content-Disposition": `attachment; filename="dcim-devices-${new Date().toISOString().split("T")[0]}.xml"`,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
