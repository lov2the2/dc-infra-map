import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api";
import {
    checkRateLimit,
    getClientIdentifier,
    rateLimitResponse,
    RATE_LIMITS,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
    // Apply rate limiting
    const identifier = getClientIdentifier(req);
    const rateLimitResult = checkRateLimit(
        `register:${identifier}`,
        RATE_LIMITS.auth
    );
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult);
    }

    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
        return errorResponse("Email and password are required", 422);
    }

    // Check if user already exists
    const existing = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
    });
    if (existing) {
        return errorResponse("User with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [user] = await db
        .insert(users)
        .values({
            name: name || null,
            email,
            hashedPassword,
            role: "viewer",
        })
        .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
        });

    return successResponse(user, 201);
}
