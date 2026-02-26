import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
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
        `reset-password:${identifier}`,
        RATE_LIMITS.auth
    );
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult);
    }

    const body = await req.json();
    const { email, token, newPassword } = body;

    if (!email || !token || !newPassword) {
        return errorResponse("Email, token, and new password are required", 422);
    }

    // Look up the token in verificationTokens
    const verificationToken = await db.query.verificationTokens.findFirst({
        where: (vt, { and, eq }) =>
            and(eq(vt.identifier, email), eq(vt.token, token)),
    });

    if (!verificationToken) {
        return errorResponse("Invalid or expired token", 400);
    }

    // Check token expiry
    if (verificationToken.expires < new Date()) {
        // Clean up expired token
        await db
            .delete(verificationTokens)
            .where(
                and(
                    eq(verificationTokens.identifier, email),
                    eq(verificationTokens.token, token)
                )
            );
        return errorResponse("Token expired", 400);
    }

    // Update user's password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db
        .update(users)
        .set({ hashedPassword, updatedAt: new Date() })
        .where(eq(users.email, email));

    // Delete the used token
    await db
        .delete(verificationTokens)
        .where(
            and(
                eq(verificationTokens.identifier, email),
                eq(verificationTokens.token, token)
            )
        );

    return successResponse({ message: "Password has been reset successfully." });
}
