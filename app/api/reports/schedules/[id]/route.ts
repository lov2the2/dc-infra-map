import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { reportSchedules } from "@/db/schema";
import { withAuth } from "@/lib/auth/with-auth";
import { reloadSchedule } from "@/lib/scheduler/report-scheduler";

export const GET = withAuth("reports", "read", async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;

    const [schedule] = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, id));

    if (!schedule) {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json(schedule);
});

export const PATCH = withAuth("reports", "create", async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;

    const [existing] = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, id));

    if (!existing) {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const body = await req.json();
    const [updated] = await db
        .update(reportSchedules)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(reportSchedules.id, id))
        .returning();

    await reloadSchedule(id);

    return NextResponse.json(updated);
});

export const DELETE = withAuth("reports", "create", async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;

    const [existing] = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, id));

    if (!existing) {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Delete from DB first so reloadSchedule will find no record and not re-register
    await db.delete(reportSchedules).where(eq(reportSchedules.id, id));

    // Stop any running cron task for this schedule
    await reloadSchedule(id);

    return NextResponse.json({ message: "Schedule deleted" });
});
