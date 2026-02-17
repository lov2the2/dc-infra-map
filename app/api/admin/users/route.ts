import { desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("users", "read", async (_req, _session) => {
    const result = await db.query.users.findMany({
        columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: [desc(users.createdAt)],
    });

    return successResponse(result);
});

export const POST = withAuth("users", "create", async (req, session) => {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!email || !password) {
        return errorResponse("Email and password are required", 422);
    }

    // Check if user already exists
    const existing = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
    });
    if (existing) return errorResponse("User with this email already exists", 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
        name: name || null,
        email,
        hashedPassword,
        role: role || "viewer",
    }).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
    });

    await logAudit(session.user.id, "create", "users", user.id, null, user as Record<string, unknown>);

    return successResponse(user, 201);
});
