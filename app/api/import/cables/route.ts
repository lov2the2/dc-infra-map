import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { db } from "@/db";
import { cables } from "@/db/schema";
import { auth } from "@/auth";
import { errorResponse, handleApiError, successResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { parseCsv, validateRows } from "@/lib/export/csv-import";

const cableCsvSchema = z.object({
    label: z.string().min(1, "Label is required"),
    cableType: z.enum([
        "cat5e", "cat6", "cat6a", "fiber-om3", "fiber-om4", "fiber-sm",
        "dac", "power", "console",
    ]),
    status: z.enum(["connected", "planned", "decommissioned"]).optional().default("connected"),
    terminationAType: z.enum([
        "interface", "frontPort", "rearPort", "consolePort", "powerPort", "powerOutlet",
    ]),
    terminationAId: z.string().min(1, "Termination A ID is required"),
    terminationBType: z.enum([
        "interface", "frontPort", "rearPort", "consolePort", "powerPort", "powerOutlet",
    ]),
    terminationBId: z.string().min(1, "Termination B ID is required"),
    length: z.string().optional(),
    color: z.string().optional(),
    tenantId: z.string().optional(),
});

type CableCsvRow = z.infer<typeof cableCsvSchema>;

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.user.role === "viewer") return errorResponse("Forbidden", 403);

        const { searchParams } = new URL(req.url);
        const confirm = searchParams.get("confirm") === "true";

        const body = await req.json();
        const csvText = body.csv as string;
        if (!csvText) return errorResponse("CSV data is required in 'csv' field", 400);

        const rows = parseCsv(csvText);
        if (rows.length === 0) return errorResponse("No data rows found in CSV", 400);

        const { valid, errors } = validateRows<CableCsvRow>(rows, cableCsvSchema);

        if (!confirm) {
            return successResponse({ valid, errors });
        }

        let importedCount = 0;
        for (const row of valid) {
            const [created] = await db.insert(cables).values({
                label: row.label,
                cableType: row.cableType,
                status: row.status ?? "connected",
                terminationAType: row.terminationAType,
                terminationAId: row.terminationAId,
                terminationBType: row.terminationBType,
                terminationBId: row.terminationBId,
                length: row.length || null,
                color: row.color || null,
                tenantId: row.tenantId || null,
            }).returning();

            await logAudit(session.user.id, "create", "cables", created.id, null, created as Record<string, unknown>, "CSV import");
            importedCount++;
        }

        return successResponse({
            imported: importedCount,
            errors,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
