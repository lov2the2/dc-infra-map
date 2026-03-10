import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { tenantCreateSchema } from "@/lib/validators/tenant";
import { withAuthOnly } from "@/lib/auth/with-auth";

// Parse a CSV string into an array of row objects using the header row as keys.
function parseCsv(csvText: string): Record<string, string>[] {
    const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
            row[header] = values[i] ?? "";
        });
        return row;
    });
}

// Extract CSV text from either multipart/form-data (file field) or JSON body
// ({ csv: string }).  The import dialog sends multipart/form-data exclusively,
// but we keep JSON support for backward compatibility with direct API calls.
async function extractCsv(req: NextRequest): Promise<string | null> {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData().catch(() => null);
        const file = formData?.get("file");
        if (!file || !(file instanceof Blob)) return null;
        return file.text();
    }
    const body = await req.json().catch(() => null);
    if (!body || typeof body.csv !== "string") return null;
    return body.csv;
}

export const POST = withAuthOnly(async (req: NextRequest) => {
    const confirm = req.nextUrl.searchParams.get("confirm") === "true";

    const csvText = await extractCsv(req);
    if (!csvText) {
        return NextResponse.json({ error: "CSV data required" }, { status: 400 });
    }

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
        return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 });
    }

    const valid: Record<string, unknown>[] = [];
    const errors: { row: number; field: string; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 accounts for 1-based index and header row

        const parsed = tenantCreateSchema.safeParse({
            name: row.name || undefined,
            slug: row.slug || undefined,
            description: row.description || null,
        });

        if (!parsed.success) {
            const fieldErrors = parsed.error.issues;
            for (const issue of fieldErrors) {
                errors.push({
                    row: rowNum,
                    field: issue.path.join("."),
                    message: issue.message,
                });
            }
        } else {
            valid.push(parsed.data as Record<string, unknown>);
        }
    }

    // Validation-only pass: return preview data
    if (!confirm) {
        return NextResponse.json({
            data: { valid, errors },
        });
    }

    // Confirm pass: insert valid rows into the database
    if (valid.length === 0) {
        return NextResponse.json({
            data: { imported: 0, errors },
        });
    }

    await db
        .insert(tenants)
        .values(
            valid.map((row) => ({
                name: row.name as string,
                slug: row.slug as string,
                description: (row.description as string | null) ?? null,
            }))
        )
        .onConflictDoNothing();

    return NextResponse.json({
        data: { imported: valid.length, errors },
    });
});
