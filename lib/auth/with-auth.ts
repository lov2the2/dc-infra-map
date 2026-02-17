import { NextRequest, NextResponse } from "next/server";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { errorResponse, handleApiError } from "@/lib/api";
import { checkPermission, Resource, Action } from "@/lib/auth/rbac";

type AuthenticatedHandler = (
    req: NextRequest,
    session: Session
) => Promise<NextResponse | Response>;

export function withAuth(
    resource: Resource,
    action: Action,
    handler: AuthenticatedHandler
) {
    return async (req: NextRequest) => {
        try {
            const session = await auth();
            if (!session) return errorResponse("Unauthorized", 401);
            if (!checkPermission(session.user.role, resource, action))
                return errorResponse("Forbidden", 403);
            return await handler(req, session);
        } catch (error) {
            return handleApiError(error);
        }
    };
}

// Variant for routes that only need authentication (no permission check)
type AuthOnlyHandler = (
    req: NextRequest,
    session: Session
) => Promise<NextResponse | Response>;

export function withAuthOnly(handler: AuthOnlyHandler) {
    return async (req: NextRequest) => {
        try {
            const session = await auth();
            if (!session) return errorResponse("Unauthorized", 401);
            return await handler(req, session);
        } catch (error) {
            return handleApiError(error);
        }
    };
}
