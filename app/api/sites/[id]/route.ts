import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("sites", "read", async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const site = await db.query.sites.findFirst({
        where: eq(sites.id, id),
        with: { region: true, tenant: true, locations: true },
    });

    if (!site) return errorResponse("Site not found", 404);
    return successResponse(site);
});

export const PATCH = withAuth("sites", "update", async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const body = await req.json();
    const [updated] = await db
        .update(sites)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(sites.id, id))
        .returning();

    if (!updated) return errorResponse("Site not found", 404);
    return successResponse(updated);
});

export const DELETE = withAuth("sites", "delete", async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const [deleted] = await db
        .update(sites)
        .set({ deletedAt: new Date() })
        .where(eq(sites.id, id))
        .returning();

    if (!deleted) return errorResponse("Site not found", 404);
    return successResponse({ message: "Site deleted" });
});
