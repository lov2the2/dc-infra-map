import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { successResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("sites", "read", async (_req, _session) => {
    const result = await db.query.sites.findMany({
        where: isNull(sites.deletedAt),
        with: { region: true, tenant: true },
    });

    return successResponse(result);
});

export const POST = withAuth("sites", "create", async (req, _session) => {
    const body = await req.json();
    const [site] = await db.insert(sites).values(body).returning();

    return successResponse(site, 201);
});
