import { eq } from "drizzle-orm";
import { db } from "@/db";
import { verificationTokens } from "@/db/schema";
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
        `forgot-password:${identifier}`,
        RATE_LIMITS.auth
    );
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult);
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
        return errorResponse("Email is required", 422);
    }

    // Check if user exists — always return 200 to prevent email enumeration
    const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
    });

    if (!user) {
        return successResponse({
            message: "If the email exists, a reset link has been sent.",
        });
    }

    // Delete any existing token for this identifier before creating a new one
    await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, email));

    // Create a new reset token valid for 1 hour
    const resetToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
        identifier: email,
        token: resetToken,
        expires,
    });

    const responseData: { message: string; resetToken?: string } = {
        message: "If the email exists, a reset link has been sent.",
    };

    // Expose token in development environment since SMTP may not be configured
    if (process.env.NODE_ENV === "development") {
        responseData.resetToken = resetToken;
    }

    return successResponse(responseData);
}
