import { NextRequest } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

// GET /api/devices/[id] — get device by id
export const GET = withAuth("devices", "read", async (req: NextRequest) => {
    const segments = req.nextUrl.pathname.split("/");
    const id = segments[segments.length - 1];

    const device = await db.query.devices.findFirst({
        where: and(eq(devices.id, id), isNull(devices.deletedAt)),
    });

    if (!device) return errorResponse("Device not found", 404);
    return successResponse(device);
});

// PATCH /api/devices/[id] — update device fields
export const PATCH = withAuth("devices", "update", async (req: NextRequest) => {
    const segments = req.nextUrl.pathname.split("/");
    const id = segments[segments.length - 1];

    const body = await req.json();

    const updates: Record<string, unknown> = {};

    // Nullable string fields
    for (const field of ["rackId", "tenantId", "serialNumber", "assetTag", "primaryIp", "description"]) {
        if (field in body) updates[field] = body[field] ?? null;
    }

    // Non-nullable string fields
    for (const field of ["name", "status", "face"]) {
        if (field in body && typeof body[field] === "string") updates[field] = body[field];
    }

    // Numeric nullable field
    if ("position" in body) {
        updates.position = body.position !== null ? Number(body.position) : null;
    }

    if (Object.keys(updates).length === 0) {
        return errorResponse("No fields to update", 400);
    }

    updates.updatedAt = new Date();

    const [updated] = await db
        .update(devices)
        .set(updates)
        .where(and(eq(devices.id, id), isNull(devices.deletedAt)))
        .returning();

    if (!updated) {
        return errorResponse("Device not found", 404);
    }

    return successResponse(updated);
});
