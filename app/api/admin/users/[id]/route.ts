import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("users", "read", async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
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
});

export const PATCH = withAuth("users", "update", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
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
});

export const DELETE = withAuth("users", "delete", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;

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
});
