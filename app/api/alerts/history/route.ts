import { db } from "@/db";
import { alertHistory } from "@/db/schema/alerts";
import { desc } from "drizzle-orm";
import { successResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("alert_history", "read", async (_req, _session) => {
    const history = await db
        .select()
        .from(alertHistory)
        .orderBy(desc(alertHistory.createdAt));

    return successResponse(history);
});
