import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import {
    getMockNotificationChannels,
    createMockNotificationChannel,
} from "@/lib/alerts/evaluate";
import type { NotificationChannelFormData } from "@/types/alerts";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_channels", "read")) return errorResponse("Forbidden", 403);

        return successResponse(getMockNotificationChannels());
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

        const channel = createMockNotificationChannel(body);
        return successResponse(channel, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
