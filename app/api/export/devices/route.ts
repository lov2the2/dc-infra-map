import { isNull, and, eq } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { createWorkbook, addSheet, excelResponse } from "@/lib/export/excel";
import { withAuthOnly } from "@/lib/auth/with-auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const GET = withAuthOnly(async (req, _session) => {
    const rlResult = checkRateLimit(`export:${getClientIdentifier(req)}`, RATE_LIMITS.exportImport);
    if (!rlResult.success) return rateLimitResponse(rlResult);
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    const status = searchParams.get("status");

    const conditions = [isNull(devices.deletedAt)];
    if (tenantId) conditions.push(eq(devices.tenantId, tenantId));
    if (status) conditions.push(eq(devices.status, status as "active"));

    const result = await db.query.devices.findMany({
        where: and(...conditions),
        with: {
            deviceType: { with: { manufacturer: true } },
            rack: { with: { location: { with: { site: true } } } },
            tenant: true,
        },
    });

    const rows = result.map((d) => ({
        name: d.name,
        type: d.deviceType.model,
        manufacturer: d.deviceType.manufacturer.name,
        rack: d.rack?.name ?? "",
        position: d.position ?? "",
        status: d.status,
        serial: d.serialNumber ?? "",
        assetTag: d.assetTag ?? "",
        tenant: d.tenant?.name ?? "",
    }));

    const wb = createWorkbook();
    addSheet(wb, "Devices", [
        { header: "Name", key: "name" },
        { header: "Type", key: "type" },
        { header: "Manufacturer", key: "manufacturer" },
        { header: "Rack", key: "rack" },
        { header: "Position", key: "position", width: 10 },
        { header: "Status", key: "status", width: 15 },
        { header: "Serial", key: "serial" },
        { header: "Asset Tag", key: "assetTag" },
        { header: "Tenant", key: "tenant" },
    ], rows);

    const date = new Date().toISOString().split("T")[0];
    return excelResponse(wb, `dcim-devices-${date}.xlsx`);
});
