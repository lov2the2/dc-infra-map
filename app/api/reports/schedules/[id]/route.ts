import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reportSchedules } from "@/db/schema";
import { successResponse, errorResponse, getRouteId } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { reloadSchedule } from "@/lib/scheduler/report-scheduler";

export const GET = withAuth("reports", "read", async (req, _session) => {
    const id = getRouteId(req);

    const [schedule] = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, id));

    if (!schedule) return errorResponse("Schedule not found", 404);
    return successResponse(schedule);
});

export const PATCH = withAuth("reports", "create", async (req, _session) => {
    const id = getRouteId(req);

    const [existing] = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, id));

    if (!existing) return errorResponse("Schedule not found", 404);

    const body = await req.json();
    const [updated] = await db
        .update(reportSchedules)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(reportSchedules.id, id))
        .returning();

    await reloadSchedule(id);

    return successResponse(updated);
});

export const DELETE = withAuth("reports", "create", async (req, _session) => {
    const id = getRouteId(req);

    const [existing] = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, id));

    if (!existing) return errorResponse("Schedule not found", 404);

    // Delete from DB first so reloadSchedule will find no record and not re-register
    await db.delete(reportSchedules).where(eq(reportSchedules.id, id));

    // Stop any running cron task for this schedule
    await reloadSchedule(id);

    return successResponse({ message: "Schedule deleted" });
});
