import { NextRequest } from "next/server";
import { handlers } from "@/auth";
import {
    checkRateLimit,
    getClientIdentifier,
    rateLimitResponse,
    RATE_LIMITS,
} from "@/lib/rate-limit";

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
    const identifier = `auth:${getClientIdentifier(request)}`;
    const result = checkRateLimit(identifier, RATE_LIMITS.auth);
    if (!result.success) {
        return rateLimitResponse(result);
    }
    return handlers.POST(request);
}
