import { isNull, and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { accessLogs } from "@/db/schema";
import { createWorkbook, addSheet, excelResponse } from "@/lib/export/excel";
import { withAuthOnly } from "@/lib/auth/with-auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

function formatDate(date: Date | null): string {
    if (!date) return "";
    return date.toISOString().replace("T", " ").substring(0, 19);
}

export const GET = withAuthOnly(async (req, _session) => {
    const rlResult = checkRateLimit(`export:${getClientIdentifier(req)}`, RATE_LIMITS.exportImport);
    if (!rlResult.success) return rateLimitResponse(rlResult);

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const conditions = [isNull(accessLogs.deletedAt)];
    if (siteId) conditions.push(eq(accessLogs.siteId, siteId));
    if (from) conditions.push(gte(accessLogs.checkInAt, new Date(from)));
    if (to) conditions.push(lte(accessLogs.checkInAt, new Date(to)));

    const result = await db.query.accessLogs.findMany({
        where: and(...conditions),
        with: { site: true },
    });

    const rows = result.map((log) => ({
        personnel: log.personnelName,
        company: log.company ?? "",
        accessType: log.accessType,
        status: log.status,
        site: log.site.name,
        checkIn: formatDate(log.checkInAt),
        checkOut: formatDate(log.actualCheckOutAt),
        purpose: log.purpose ?? "",
        badge: log.badgeNumber ?? "",
    }));

    const wb = createWorkbook();
    addSheet(wb, "Access Logs", [
        { header: "Personnel", key: "personnel" },
        { header: "Company", key: "company" },
        { header: "Access Type", key: "accessType", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Site", key: "site" },
        { header: "Check In", key: "checkIn", width: 22 },
        { header: "Check Out", key: "checkOut", width: 22 },
        { header: "Purpose", key: "purpose", width: 30 },
        { header: "Badge", key: "badge", width: 12 },
    ], rows);

    const date = new Date().toISOString().split("T")[0];
    return excelResponse(wb, `dcim-access-${date}.xlsx`);
});
