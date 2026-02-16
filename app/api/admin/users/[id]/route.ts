import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { checkPermission } from "@/lib/auth/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "users", "read")) {
            return errorResponse("Forbidden", 403);
        }

        const { id } = await context.params;
        const user = await db.query.users.findFirst({
            where: eq(users.id, id),
            columns: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) return errorResponse("User not found", 404);
        return successResponse(user);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "users", "update")) {
            return errorResponse("Forbidden", 403);
        }

        const { id } = await context.params;
        const body = await req.json();
        const { name, email, password, role } = body;

        const existing = await db.query.users.findFirst({ where: eq(users.id, id) });
        if (!existing) return errorResponse("User not found", 404);

        // Prevent demoting self
        if (id === session.user.id && role && role !== existing.role) {
            return errorResponse("Cannot change your own role", 400);
        }

        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (password) updateData.hashedPassword = await bcrypt.hash(password, 12);

        const [updated] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                updatedAt: users.updatedAt,
            });

        await logAudit(
            session.user.id,
            "update",
            "users",
            id,
            { name: existing.name, email: existing.email, role: existing.role },
            { name: updated.name, email: updated.email, role: updated.role },
        );

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "users", "delete")) {
            return errorResponse("Forbidden", 403);
        }

        const { id } = await context.params;

        // Prevent self-deletion
        if (id === session.user.id) {
            return errorResponse("Cannot delete your own account", 400);
        }

        const existing = await db.query.users.findFirst({ where: eq(users.id, id) });
        if (!existing) return errorResponse("User not found", 404);

        await db.delete(users).where(eq(users.id, id));

        await logAudit(
            session.user.id,
            "delete",
            "users",
            id,
            { name: existing.name, email: existing.email, role: existing.role },
            null,
        );

        return successResponse({ message: "User deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
