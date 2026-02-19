import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { reportSchedules } from "@/db/schema";
import { withAuth } from "@/lib/auth/with-auth";
import { runSchedule } from "@/lib/scheduler/report-scheduler";

export const POST = withAuth("reports", "create", async (req, _session) => {
    // pathname: /api/reports/schedules/{id}/run — get the segment before "run"
    const parts = req.nextUrl.pathname.split("/");
    const id = parts[parts.length - 2];

    const [schedule] = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, id));

    if (!schedule) {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    await runSchedule({
        id: schedule.id,
        name: schedule.name,
        reportType: schedule.reportType,
        cronExpression: schedule.cronExpression,
        recipientEmails: schedule.recipientEmails,
    });

    return NextResponse.json({ success: true });
});
