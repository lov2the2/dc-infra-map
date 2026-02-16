import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { notificationChannels } from "@/db/schema/alerts";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";
import type { NotificationChannelFormData } from "@/types/alerts";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_channels", "read")) return errorResponse("Forbidden", 403);

        const channels = await db.select().from(notificationChannels);
        return successResponse(channels);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_channels", "create")) return errorResponse("Forbidden", 403);

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
    } catch (error) {
        return handleApiError(error);
    }
}
