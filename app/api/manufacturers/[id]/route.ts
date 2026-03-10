import { NextRequest } from "next/server";
import { eq, ilike, isNull, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { manufacturers } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, handleApiError, getRouteId } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { manufacturerUpdateSchema } from "@/lib/validators/manufacturer";

// GET /api/manufacturers/[id]
export const GET = withAuth("devices", "read", async (req: NextRequest) => {
    try {
        const id = getRouteId(req);
        const manufacturer = await db.query.manufacturers.findFirst({
            where: (m, { eq }) => eq(m.id, id),
            with: { deviceTypes: true },
        });

        if (!manufacturer || manufacturer.deletedAt) {
            return errorResponse("Manufacturer not found", 404);
        }

        return successResponse(manufacturer);
    } catch (error) {
        return handleApiError(error);
    }
});

// PATCH /api/manufacturers/[id]
export const PATCH = withAuth("devices", "update", async (req: NextRequest) => {
    try {
        const id = getRouteId(req);
        const body = await req.json();
        const parsed = manufacturerUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return validationErrorResponse(parsed.error);
        }

        const { name, slug, description } = parsed.data;

        // Check for similar names (excluding self) if name is being updated
        if (name) {
            const similarResults = await db
                .select({ id: manufacturers.id, name: manufacturers.name })
                .from(manufacturers)
                .where(and(ilike(manufacturers.name, `%${name}%`), ne(manufacturers.id, id), isNull(manufacturers.deletedAt)));

            const exactMatch = similarResults.find(
                (m) => m.name.toLowerCase() === name.toLowerCase()
            );
            if (exactMatch) {
                return errorResponse(`A manufacturer with the name "${exactMatch.name}" already exists`, 400);
            }
        }

        // Check slug uniqueness (excluding self)
        if (slug) {
            const slugConflict = await db.query.manufacturers.findFirst({
                where: (m, { eq, and, ne }) => and(eq(m.slug, slug), ne(m.id, id)),
            });
            if (slugConflict) {
                return errorResponse(`A manufacturer with the slug "${slug}" already exists`, 400);
            }
        }

        const [updated] = await db
            .update(manufacturers)
            .set({
                ...(name !== undefined && { name }),
                ...(slug !== undefined && { slug }),
                ...(description !== undefined && { description }),
                updatedAt: new Date(),
            })
            .where(eq(manufacturers.id, id))
            .returning();

        if (!updated) {
            return errorResponse("Manufacturer not found", 404);
        }

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
});

// DELETE /api/manufacturers/[id]
export const DELETE = withAuth("devices", "delete", async (req: NextRequest) => {
    try {
        const id = getRouteId(req);
        const [deleted] = await db
            .update(manufacturers)
            .set({ deletedAt: new Date() })
            .where(eq(manufacturers.id, id))
            .returning({ id: manufacturers.id });

        if (!deleted) {
            return errorResponse("Manufacturer not found", 404);
        }

        return successResponse({ message: "Manufacturer deleted" });
    } catch (error) {
        return handleApiError(error);
    }
});
