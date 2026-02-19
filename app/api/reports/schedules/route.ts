import { desc } from "drizzle-orm";
import { db } from "@/db";
import { reportSchedules } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { reloadSchedule } from "@/lib/scheduler/report-scheduler";

export const GET = withAuth("reports", "read", async (_req, _session) => {
    const schedules = await db
        .select()
        .from(reportSchedules)
        .orderBy(desc(reportSchedules.createdAt));

    return successResponse(schedules);
});

export const POST = withAuth("reports", "create", async (req, session) => {
    const body = await req.json();
    const { name, reportType, frequency, cronExpression, recipientEmails, isActive } = body;

    if (!name || !reportType || !frequency || !cronExpression || !recipientEmails) {
        return errorResponse(
            "name, reportType, frequency, cronExpression, and recipientEmails are required",
            400
        );
    }

    const [created] = await db
        .insert(reportSchedules)
        .values({
            name,
            reportType,
            frequency,
            cronExpression,
            recipientEmails,
            isActive: isActive ?? true,
            createdBy: session.user.email ?? session.user.id,
        })
        .returning();

    await reloadSchedule(created.id);

    return successResponse(created, 201);
});
