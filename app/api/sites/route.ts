import { NextRequest } from "next/server";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const result = await db.query.sites.findMany({
            where: isNull(sites.deletedAt),
            with: { region: true, tenant: true },
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
        const [site] = await db.insert(sites).values(body).returning();

        return successResponse(site, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
