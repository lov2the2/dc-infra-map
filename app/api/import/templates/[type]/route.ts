import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { errorResponse, handleApiError } from "@/lib/api";
import { getDeviceTemplate, getCableTemplate } from "@/lib/export/csv-templates";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ type: string }> },
) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { type } = await params;

        let csv: string;
        let filename: string;

        switch (type) {
            case "devices":
                csv = getDeviceTemplate();
                filename = "dcim-device-import-template.csv";
                break;
            case "cables":
                csv = getCableTemplate();
                filename = "dcim-cable-import-template.csv";
                break;
            default:
                return errorResponse("Invalid template type. Use 'devices' or 'cables'.", 400);
        }

        return new Response(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
