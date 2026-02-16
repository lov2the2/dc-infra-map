import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import {
    getMockNotificationChannelById,
    updateMockNotificationChannel,
    deleteMockNotificationChannel,
} from "@/lib/alerts/evaluate";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_channels", "read")) return errorResponse("Forbidden", 403);

        const { id } = await params;
        const channel = getMockNotificationChannelById(id);
        if (!channel) return errorResponse("Notification channel not found", 404);

        return successResponse(channel);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_channels", "update")) return errorResponse("Forbidden", 403);

        const { id } = await params;
        const body = await req.json();
        const updated = updateMockNotificationChannel(id, body);
        if (!updated) return errorResponse("Notification channel not found", 404);

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_channels", "delete")) return errorResponse("Forbidden", 403);

        const { id } = await params;
        const deleted = deleteMockNotificationChannel(id);
        if (!deleted) return errorResponse("Notification channel not found", 404);

        return successResponse({ message: "Notification channel deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
