import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { createWorkbook, addSheet, excelResponse } from "@/lib/export/excel";
import { withAuthOnly } from "@/lib/auth/with-auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const GET = withAuthOnly(async (_req, _session) => {
    const rlResult = checkRateLimit(`export:${getClientIdentifier(_req)}`, RATE_LIMITS.exportImport);
    if (!rlResult.success) return rateLimitResponse(rlResult);
    const result = await db.query.racks.findMany({
        where: isNull(racks.deletedAt),
        with: {
            location: { with: { site: true } },
            devices: {
                with: { deviceType: true },
            },
        },
    });

    const rows: Record<string, unknown>[] = [];
    for (const rack of result) {
        if (rack.devices.length === 0) {
            rows.push({
                rackName: rack.name,
                location: rack.location.name,
                site: rack.location.site.name,
                uHeight: rack.uHeight,
                deviceName: "",
                position: "",
                deviceType: "",
                status: "",
            });
        } else {
            for (const device of rack.devices) {
                rows.push({
                    rackName: rack.name,
                    location: rack.location.name,
                    site: rack.location.site.name,
                    uHeight: rack.uHeight,
                    deviceName: device.name,
                    position: device.position ?? "",
                    deviceType: device.deviceType.model,
                    status: device.status,
                });
            }
        }
    }

    const wb = createWorkbook();
    addSheet(wb, "Racks", [
        { header: "Rack Name", key: "rackName" },
        { header: "Location", key: "location" },
        { header: "Site", key: "site" },
        { header: "U-Height", key: "uHeight", width: 10 },
        { header: "Device Name", key: "deviceName" },
        { header: "Position", key: "position", width: 10 },
        { header: "Device Type", key: "deviceType" },
        { header: "Status", key: "status", width: 15 },
    ], rows);

    const date = new Date().toISOString().split("T")[0];
    return excelResponse(wb, `dcim-racks-${date}.xlsx`);
});
