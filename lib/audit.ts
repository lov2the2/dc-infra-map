import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit";

export async function logAudit(
    userId: string | null,
    action: string,
    tableName: string,
    recordId: string,
    before?: Record<string, unknown> | null,
    after?: Record<string, unknown> | null,
    reason?: string,
) {
    await db.insert(auditLogs).values({
        userId,
        action,
        tableName,
        recordId,
        changesBefore: before ?? null,
        changesAfter: after ?? null,
        reason: reason ?? null,
    });
}
