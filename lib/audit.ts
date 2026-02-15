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
        actionType: "api_call",
        tableName,
        recordId,
        changesBefore: before ?? null,
        changesAfter: after ?? null,
        reason: reason ?? null,
    });
}

export async function logLoginEvent(
    userId: string | null,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
) {
    await db.insert(auditLogs).values({
        userId,
        action: success ? "login_success" : "login_failed",
        actionType: "login",
        tableName: "users",
        recordId: userId ?? "unknown",
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
    });
}

export async function logExportEvent(
    userId: string,
    exportType: string,
    filters?: Record<string, unknown>,
) {
    await db.insert(auditLogs).values({
        userId,
        action: "export",
        actionType: "export",
        tableName: exportType,
        recordId: "bulk",
        changesAfter: filters ?? null,
    });
}
