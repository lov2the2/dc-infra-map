import { NextRequest } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "audit_logs", "read")) return errorResponse("Forbidden", 403);

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
    } catch (error) {
        return handleApiError(error);
    }
}
