import { NextRequest } from "next/server";
import { isNull, and, eq } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { auth } from "@/auth";
import { errorResponse, handleApiError } from "@/lib/api";
import { createWorkbook, addSheet, workbookToBlob } from "@/lib/export/excel";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

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
        const filename = `dcim-devices-${date}.xlsx`;
        const blob = await workbookToBlob(wb);

        return new Response(blob, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
