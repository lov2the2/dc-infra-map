import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { siteCreateSchema } from "@/lib/validators/site";
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

export const POST = withAuthOnly(async (req: NextRequest) => {
    const confirm = req.nextUrl.searchParams.get("confirm") === "true";

    const body = await req.json().catch(() => null);
    if (!body || typeof body.csv !== "string") {
        return NextResponse.json({ error: "CSV data required" }, { status: 400 });
    }

    const rows = parseCsv(body.csv);
    if (rows.length === 0) {
        return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 });
    }

    const valid: Record<string, unknown>[] = [];
    const errors: { row: number; field: string; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 accounts for 1-based index and header row

        // Convert latitude/longitude to numbers if present
        const parsed = siteCreateSchema.safeParse({
            name: row.name || undefined,
            slug: row.slug || undefined,
            status: row.status || undefined,
            facility: row.facility || null,
            address: row.address || null,
            latitude: row.latitude ? parseFloat(row.latitude) : null,
            longitude: row.longitude ? parseFloat(row.longitude) : null,
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
        .insert(sites)
        .values(
            valid.map((row) => ({
                name: row.name as string,
                slug: row.slug as string,
                status: (row.status as "active" | "planned" | "staging" | "decommissioning" | "retired") ?? "active",
                facility: (row.facility as string | null) ?? null,
                address: (row.address as string | null) ?? null,
                latitude: (row.latitude as number | null) ?? null,
                longitude: (row.longitude as number | null) ?? null,
                description: (row.description as string | null) ?? null,
            }))
        )
        .onConflictDoNothing();

    return NextResponse.json({
        data: { imported: valid.length, errors },
    });
});
