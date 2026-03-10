import { NextRequest } from "next/server";
import { and, ilike, isNull } from "drizzle-orm";
import { db } from "@/db";
import { manufacturers } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { manufacturerCreateSchema } from "@/lib/validators/manufacturer";

// GET /api/manufacturers — list all manufacturers (with device type count)
export const GET = withAuth("devices", "read", async (_req: NextRequest) => {
    try {
        const result = await db.query.manufacturers.findMany({
            where: isNull(manufacturers.deletedAt),
            orderBy: (m, { asc }) => [asc(m.name)],
            with: { deviceTypes: true },
        });
        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
});

// POST /api/manufacturers — create a manufacturer
export const POST = withAuth("devices", "create", async (req: NextRequest) => {
    try {
        const body = await req.json();
        const parsed = manufacturerCreateSchema.safeParse(body);
        if (!parsed.success) {
            return validationErrorResponse(parsed.error);
        }

        const { name, slug, description } = parsed.data;

        // Check for similar names via substring match (case-insensitive)
        const similarResults = await db
            .select({ id: manufacturers.id, name: manufacturers.name })
            .from(manufacturers)
            .where(and(ilike(manufacturers.name, `%${name}%`), isNull(manufacturers.deletedAt)));

        // Exact match check (case-insensitive)
        const exactMatch = similarResults.find(
            (m) => m.name.toLowerCase() === name.toLowerCase()
        );
        if (exactMatch) {
            return errorResponse(`A manufacturer with the name "${exactMatch.name}" already exists`, 400);
        }

        // Similar names (exclude exact matches)
        const similarNames = similarResults
            .filter((m) => m.name.toLowerCase() !== name.toLowerCase())
            .map((m) => m.name);

        // Check for slug uniqueness
        const slugConflict = await db.query.manufacturers.findFirst({
            where: (m, { eq }) => eq(m.slug, slug),
        });
        if (slugConflict) {
            return errorResponse(`A manufacturer with the slug "${slug}" already exists`, 400);
        }

        const [manufacturer] = await db
            .insert(manufacturers)
            .values({
                name,
                slug,
                description: description ?? null,
            })
            .returning();

        if (similarNames.length > 0) {
            return successResponse({ data: manufacturer, similarNames }, 201);
        }

        return successResponse(manufacturer, 201);
    } catch (error) {
        return handleApiError(error);
    }
});
