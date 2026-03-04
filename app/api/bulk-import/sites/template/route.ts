import { NextResponse } from "next/server";
import { getSiteTemplate } from "@/lib/export/csv-templates";

export async function GET() {
    const csv = getSiteTemplate();
    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="sites-template.csv"',
        },
    });
}
