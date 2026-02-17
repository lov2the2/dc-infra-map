import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { successResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("audit_logs", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const tableName = searchParams.get("tableName");
    const recordId = searchParams.get("recordId");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const conditions = [];
    if (tableName) conditions.push(eq(auditLogs.tableName, tableName));
    if (recordId) conditions.push(eq(auditLogs.recordId, recordId));

    const result = await db.query.auditLogs.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { user: true },
        orderBy: [desc(auditLogs.createdAt)],
        limit,
        offset,
    });

    return successResponse(result);
});
