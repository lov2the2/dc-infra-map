import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { powerReadingBatchSchema } from "@/lib/validators/power";
import { generateMockReading } from "@/lib/power/mock-generator";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "power_readings", "create")) return errorResponse("Forbidden", 403);

        const body = await req.json();
        const parsed = powerReadingBatchSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        // TimescaleDB insert would go here when hypertable exists
        return successResponse({ ingested: parsed.data.length }, 201);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { searchParams } = new URL(req.url);
        const feedId = searchParams.get("feedId");
        if (!feedId) return errorResponse("feedId is required", 400);

        const interval = searchParams.get("interval") ?? "5m";
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        // Generate mock historical data
        const now = new Date();
        const startTime = from ? new Date(from) : new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        const endTime = to ? new Date(to) : now;

        const intervalMs = interval === "1h" ? 3600000 : interval === "1d" ? 86400000 : 300000;
        const readings = [];

        for (let t = startTime.getTime(); t <= endTime.getTime(); t += intervalMs) {
            const reading = generateMockReading(feedId, 10); // default 10kW max for mock
            reading.time = new Date(t).toISOString();
            readings.push(reading);
        }

        return successResponse(readings);
    } catch (error) {
        return handleApiError(error);
    }
}
