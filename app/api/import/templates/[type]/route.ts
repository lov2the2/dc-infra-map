import { errorResponse, getRouteId } from "@/lib/api";
import { getDeviceTemplate, getCableTemplate } from "@/lib/export/csv-templates";
import { withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (req, _session) => {
    const type = getRouteId(req);

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
});
