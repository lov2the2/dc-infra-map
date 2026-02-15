import { NextRequest } from "next/server";
import { eq, and, isNull, like, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { accessLogs } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { accessLogCreateSchema } from "@/lib/validators/access";
import { checkPermission } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "access_logs", "read")) return errorResponse("Forbidden", 403);

        const { searchParams } = new URL(req.url);
        const siteId = searchParams.get("siteId");
        const status = searchParams.get("status");
        const accessType = searchParams.get("accessType");
        const personnelName = searchParams.get("personnelName");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const limit = parseInt(searchParams.get("limit") ?? "50", 10);
        const offset = parseInt(searchParams.get("offset") ?? "0", 10);

        const conditions = [isNull(accessLogs.deletedAt)];
        if (siteId) conditions.push(eq(accessLogs.siteId, siteId));
        if (status) conditions.push(eq(accessLogs.status, status as "checked_in"));
        if (accessType) conditions.push(eq(accessLogs.accessType, accessType as "visit"));
        if (personnelName) conditions.push(like(accessLogs.personnelName, `%${personnelName}%`));
        if (dateFrom) conditions.push(gte(accessLogs.checkInAt, new Date(dateFrom)));
        if (dateTo) conditions.push(lte(accessLogs.checkInAt, new Date(dateTo)));

        const result = await db.query.accessLogs.findMany({
            where: and(...conditions),
            with: {
                createdByUser: {
                    columns: { id: true, name: true, email: true },
                },
                site: true,
            },
            limit,
            offset,
            orderBy: (t, { desc }) => [desc(t.checkInAt)],
        });

        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "access_logs", "create")) return errorResponse("Forbidden", 403);

        const body = await req.json();
        const parsed = accessLogCreateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const data = parsed.data;
        const [accessLog] = await db
            .insert(accessLogs)
            .values({
                ...data,
                expectedCheckOutAt: data.expectedCheckOutAt
                    ? new Date(data.expectedCheckOutAt)
                    : null,
                status: "checked_in",
                checkInAt: new Date(),
                createdBy: session.user.id,
            })
            .returning();

        await logAudit(
            session.user.id,
            "create",
            "access_logs",
            accessLog.id,
            null,
            accessLog as Record<string, unknown>,
        );

        return successResponse(accessLog, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
