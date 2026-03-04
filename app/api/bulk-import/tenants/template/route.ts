import { NextResponse } from "next/server";
import { getTenantTemplate } from "@/lib/export/csv-templates";

export async function GET() {
    const csv = getTenantTemplate();
    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="tenants-template.csv"',
        },
    });
}
