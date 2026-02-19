import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reportSchedules } from "@/db/schema";
import { successResponse, errorResponse, getRouteParentId } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { runSchedule } from "@/lib/scheduler/report-scheduler";

export const POST = withAuth("reports", "create", async (req, _session) => {
    const id = getRouteParentId(req);

    const [schedule] = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, id));

    if (!schedule) return errorResponse("Schedule not found", 404);

    await runSchedule({
        id: schedule.id,
        name: schedule.name,
        reportType: schedule.reportType,
        cronExpression: schedule.cronExpression,
        recipientEmails: schedule.recipientEmails,
    });

    return successResponse({ success: true });
});
