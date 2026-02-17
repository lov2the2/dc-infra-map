import { db } from "@/db";
import { notificationChannels } from "@/db/schema/alerts";
import { successResponse, errorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import type { NotificationChannelFormData } from "@/types/alerts";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("alert_channels", "read", async (_req, _session) => {
    const channels = await db.select().from(notificationChannels);
    return successResponse(channels);
});

export const POST = withAuth("alert_channels", "create", async (req, session) => {
    const body: NotificationChannelFormData = await req.json();

    if (!body.name || !body.channelType) {
        return errorResponse("name and channelType are required", 400);
    }

    const [channel] = await db.insert(notificationChannels).values({
        name: body.name,
        channelType: body.channelType,
        config: body.config ?? {},
        enabled: body.enabled ?? true,
    }).returning();

    await logAudit(session.user.id, "create", "notification_channels", channel.id, null, channel as unknown as Record<string, unknown>);

    return successResponse(channel, 201);
});
