import { NextRequest } from "next/server";
import { ilike, isNull, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { manufacturers } from "@/db/schema";
import { successResponse, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

// GET /api/manufacturers/search?q=name&excludeId=optional
export const GET = withAuth("devices", "read", async (req: NextRequest) => {
    try {
        const q = req.nextUrl.searchParams.get("q") ?? "";
        const excludeId = req.nextUrl.searchParams.get("excludeId");

        if (!q.trim()) {
            return successResponse({ exact: false, similar: [] });
        }

        const whereConditions = [
            ilike(manufacturers.name, `%${q}%`),
            isNull(manufacturers.deletedAt),
        ];
        if (excludeId) {
            whereConditions.push(ne(manufacturers.id, excludeId));
        }

        const results = await db
            .select({ id: manufacturers.id, name: manufacturers.name })
            .from(manufacturers)
            .where(and(...whereConditions));

        // Check for exact match (case-insensitive)
        const exact = results.some((m) => m.name.toLowerCase() === q.toLowerCase());

        // Similar results: all matches (exact ones are still "similar" for display)
        const similar = results
            .filter((m) => m.name.toLowerCase() !== q.toLowerCase())
            .slice(0, 5);

        return successResponse({ exact, similar });
    } catch (error) {
        return handleApiError(error);
    }
});
