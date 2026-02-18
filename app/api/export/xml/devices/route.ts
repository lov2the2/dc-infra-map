import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { buildXml } from "@/lib/export/xml";
import { withAuthOnly } from "@/lib/auth/with-auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const GET = withAuthOnly(async (_req, _session) => {
    const rlResult = checkRateLimit(`export:${getClientIdentifier(_req)}`, RATE_LIMITS.exportImport);
    if (!rlResult.success) return rateLimitResponse(rlResult);
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
});
