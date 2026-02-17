import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { powerReadingBatchSchema } from "@/lib/validators/power";
import { db } from "@/db";
import { powerReadings } from "@/db/schema/power";
import { generateMockReading } from "@/lib/power/mock-generator";
import { and, eq, gte, lte } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "power_readings", "create")) return errorResponse("Forbidden", 403);

        const body = await req.json();
        const parsed = powerReadingBatchSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const inserted = await db
            .insert(powerReadings)
            .values(
                parsed.data.map((r) => ({
                    feedId: r.feedId,
                    voltageV: r.voltageV,
                    currentA: r.currentA,
                    powerKw: r.powerKw,
                    powerFactor: r.powerFactor ?? null,
                    energyKwh: r.energyKwh ?? null,
                }))
            )
            .returning();

        return successResponse({ ingested: inserted.length }, 201);
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

        const from = searchParams.get("from");
        const to = searchParams.get("to");

        const now = new Date();
        const startTime = from ? new Date(from) : new Date(now.getTime() - 60 * 60 * 1000);
        const endTime = to ? new Date(to) : now;

        // Query real readings from DB
        const dbReadings = await db
            .select()
            .from(powerReadings)
            .where(
                and(
                    eq(powerReadings.feedId, feedId),
                    gte(powerReadings.recordedAt, startTime),
                    lte(powerReadings.recordedAt, endTime)
                )
            )
            .orderBy(powerReadings.recordedAt);

        if (dbReadings.length > 0) {
            const readings = dbReadings.map((r) => ({
                feedId: r.feedId,
                time: r.recordedAt.toISOString(),
                voltageV: r.voltageV,
                currentA: r.currentA,
                powerKw: r.powerKw,
                powerFactor: r.powerFactor ?? 0,
                energyKwh: r.energyKwh ?? 0,
            }));
            return successResponse(readings);
        }

        // Fallback to mock data when no DB readings exist
        const interval = searchParams.get("interval") ?? "5m";
        const intervalMs = interval === "1h" ? 3600000 : interval === "1d" ? 86400000 : 300000;
        const readings = [];

        for (let t = startTime.getTime(); t <= endTime.getTime(); t += intervalMs) {
            const reading = generateMockReading(feedId, 10);
            reading.time = new Date(t).toISOString();
            readings.push(reading);
        }

        return successResponse(readings);
    } catch (error) {
        return handleApiError(error);
    }
}
