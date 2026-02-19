import { NextRequest, NextResponse } from "next/server";
import type { ZodError } from "zod/v4";

export function successResponse<T>(data: T, status = 200) {
    return NextResponse.json({ data }, { status });
}

export function errorResponse(message: string, status = 400) {
    return NextResponse.json({ error: message }, { status });
}

export function validationErrorResponse(error: ZodError) {
    const issues = error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
    }));
    return NextResponse.json({ error: "Validation failed", issues }, { status: 422 });
}

export function handleApiError(error: unknown) {
    console.error("API Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
}

export function getRouteId(req: NextRequest): string {
    return req.nextUrl.pathname.split("/").pop()!;
}

/** For nested routes like /api/resource/[id]/action — returns [id] (second-to-last segment). */
export function getRouteParentId(req: NextRequest): string {
    const segments = req.nextUrl.pathname.split("/");
    return segments[segments.length - 2];
}
