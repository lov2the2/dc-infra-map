import { NextRequest } from "next/server";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { withAuth } from "@/lib/auth/with-auth";
import { successResponse, errorResponse } from "@/lib/api";

export const POST = withAuth(
    "devices",
    "delete",
    async (req: NextRequest) => {
        const body = await req.json() as {
            ids?: unknown;
            action?: string;
            data?: { status?: string };
        };

        const { ids, action, data } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return errorResponse("ids must be a non-empty array", 400);
        }

        const deviceIds = ids as string[];

        if (action === "delete") {
            await db
                .update(devices)
                .set({ deletedAt: new Date() })
                .where(inArray(devices.id, deviceIds));
            return successResponse({ count: deviceIds.length, action: "deleted" });
        }

        if (action === "update" && data) {
            // Only allow status updates via batch for safety
            await db
                .update(devices)
                .set({ status: data.status as typeof devices.$inferInsert.status, updatedAt: new Date() })
                .where(inArray(devices.id, deviceIds));
            return successResponse({ count: deviceIds.length, action: "updated" });
        }

        return errorResponse('Invalid action. Use "delete" or "update"', 400);
    },
);
