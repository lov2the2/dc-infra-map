import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { devices, deviceTypes, racks } from "@/db/schema";
import { auth } from "@/auth";
import { errorResponse, handleApiError, successResponse } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";
import { parseCsv, validateRows } from "@/lib/export/csv-import";

const deviceCsvSchema = z.object({
    name: z.string().min(1, "Name is required"),
    deviceTypeId: z.string().min(1, "Device type ID is required"),
    rackId: z.string().optional(),
    status: z.enum(["active", "planned", "staged", "failed", "decommissioning", "decommissioned"]).optional().default("active"),
    position: z.string().optional().transform((v) => (v ? parseInt(v, 10) : null)),
    serialNumber: z.string().optional(),
    assetTag: z.string().optional(),
    tenantId: z.string().optional(),
});

type DeviceCsvRow = z.infer<typeof deviceCsvSchema>;

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "devices", "create")) return errorResponse("Forbidden", 403);

        const { searchParams } = new URL(req.url);
        const confirm = searchParams.get("confirm") === "true";

        const body = await req.json();
        const csvText = body.csv as string;
        if (!csvText) return errorResponse("CSV data is required in 'csv' field", 400);

        const rows = parseCsv(csvText);
        if (rows.length === 0) return errorResponse("No data rows found in CSV", 400);

        const { valid, errors } = validateRows<DeviceCsvRow>(rows, deviceCsvSchema);

        // FK validation for valid rows
        const fkErrors: { row: number; field: string; message: string }[] = [];
        for (let i = 0; i < valid.length; i++) {
            const row = valid[i];
            const deviceType = await db.query.deviceTypes.findFirst({
                where: eq(deviceTypes.id, row.deviceTypeId),
            });
            if (!deviceType) {
                fkErrors.push({ row: i + 2, field: "deviceTypeId", message: "Device type not found" });
            }
            if (row.rackId) {
                const rack = await db.query.racks.findFirst({
                    where: eq(racks.id, row.rackId),
                });
                if (!rack) {
                    fkErrors.push({ row: i + 2, field: "rackId", message: "Rack not found" });
                }
            }
        }

        const allErrors = [...errors, ...fkErrors];

        if (!confirm) {
            return successResponse({ valid, errors: allErrors });
        }

        // Filter out rows with FK errors
        const fkErrorRows = new Set(fkErrors.map((e) => e.row));
        const insertable = valid.filter((_, i) => !fkErrorRows.has(i + 2));

        let importedCount = 0;
        for (const row of insertable) {
            const [created] = await db.insert(devices).values({
                name: row.name,
                deviceTypeId: row.deviceTypeId,
                rackId: row.rackId || null,
                status: row.status ?? "active",
                position: row.position,
                serialNumber: row.serialNumber || null,
                assetTag: row.assetTag || null,
                tenantId: row.tenantId || null,
            }).returning();

            await logAudit(session.user.id, "create", "devices", created.id, null, created as Record<string, unknown>, "CSV import");
            importedCount++;
        }

        return successResponse({
            imported: importedCount,
            errors: allErrors,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
