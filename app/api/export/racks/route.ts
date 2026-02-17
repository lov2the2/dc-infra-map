import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { createWorkbook, addSheet, workbookToBlob } from "@/lib/export/excel";
import { withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (_req, _session) => {
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
    const filename = `dcim-racks-${date}.xlsx`;
    const blob = await workbookToBlob(wb);

    return new Response(blob, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
});
