/**
 * Simple sliding window rate limiter using in-memory LRU cache.
 * Suitable for single-instance deployments (10-50 users).
 * For multi-instance/distributed deployments, use Redis-backed solution.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// Simple LRU-like cache (Map preserves insertion order)
const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10000;

function cleanup() {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) {
            store.delete(key);
        }
    }
}

export interface RateLimitConfig {
    /** Maximum requests per window */
    limit: number;
    /** Window duration in seconds */
    windowSec: number;
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
}

/**
 * Check rate limit for a given identifier (e.g., IP address or user ID).
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const key = identifier;

    // Periodic cleanup to prevent unbounded growth
    if (store.size > MAX_STORE_SIZE) {
        cleanup();
    }

    const entry = store.get(key);
    const windowMs = config.windowSec * 1000;

    if (!entry || entry.resetAt < now) {
        // New window
        store.set(key, { count: 1, resetAt: now + windowMs });
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit - 1,
            resetAt: now + windowMs,
        };
    }

    if (entry.count >= config.limit) {
        return {
            success: false,
            limit: config.limit,
            remaining: 0,
            resetAt: entry.resetAt,
        };
    }

    entry.count++;
    return {
        success: true,
        limit: config.limit,
        remaining: config.limit - entry.count,
        resetAt: entry.resetAt,
    };
}

/** Predefined rate limit configs */
export const RATE_LIMITS = {
    /** Auth endpoints: 10 attempts per minute */
    auth: { limit: 10, windowSec: 60 },
    /** Export/import endpoints: 20 requests per minute */
    exportImport: { limit: 20, windowSec: 60 },
    /** General API: 200 requests per minute */
    api: { limit: 200, windowSec: 60 },
} satisfies Record<string, RateLimitConfig>;

/**
 * Get client identifier from request (IP address or forwarded IP).
 */
export function getClientIdentifier(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Create a rate-limited Response (429 Too Many Requests).
 */
export function rateLimitResponse(result: RateLimitResult): Response {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return Response.json(
        { error: "Too many requests. Please try again later." },
        {
            status: 429,
            headers: {
                "X-RateLimit-Limit": String(result.limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
                "Retry-After": String(retryAfter),
            },
        }
    );
}
