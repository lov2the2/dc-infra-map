import { NextRequest } from "next/server";
import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { manufacturers } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const result = await db.query.manufacturers.findMany({
            where: isNull(manufacturers.deletedAt),
        });

        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.user.role === "viewer") return errorResponse("Forbidden", 403);

        const body = await req.json();
        if (!body.name || !body.slug) {
            return errorResponse("name and slug are required", 422);
        }

        const [manufacturer] = await db.insert(manufacturers).values(body).returning();
        return successResponse(manufacturer, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
