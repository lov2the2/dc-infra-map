import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { cables } from "@/db/schema";
import { createWorkbook, addSheet, workbookToBlob } from "@/lib/export/excel";
import { withAuthOnly } from "@/lib/auth/with-auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const GET = withAuthOnly(async (_req, _session) => {
    const rlResult = checkRateLimit(`export:${getClientIdentifier(_req)}`, RATE_LIMITS.exportImport);
    if (!rlResult.success) return rateLimitResponse(rlResult);
    const result = await db.query.cables.findMany({
        where: isNull(cables.deletedAt),
        with: { tenant: true },
    });

    const rows = result.map((c) => ({
        label: c.label,
        type: c.cableType,
        status: c.status,
        sideAType: c.terminationAType,
        sideAId: c.terminationAId,
        sideBType: c.terminationBType,
        sideBId: c.terminationBId,
        length: c.length ?? "",
        color: c.color ?? "",
        tenant: c.tenant?.name ?? "",
    }));

    const wb = createWorkbook();
    addSheet(wb, "Cables", [
        { header: "Label", key: "label" },
        { header: "Type", key: "type" },
        { header: "Status", key: "status", width: 15 },
        { header: "Side A Type", key: "sideAType" },
        { header: "Side A ID", key: "sideAId" },
        { header: "Side B Type", key: "sideBType" },
        { header: "Side B ID", key: "sideBId" },
        { header: "Length", key: "length", width: 10 },
        { header: "Color", key: "color", width: 10 },
        { header: "Tenant", key: "tenant" },
    ], rows);

    const date = new Date().toISOString().split("T")[0];
    const filename = `dcim-cables-${date}.xlsx`;
    const blob = await workbookToBlob(wb);

    return new Response(blob, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
});
