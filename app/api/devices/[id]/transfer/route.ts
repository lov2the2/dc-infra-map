import { eq, isNull } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/db";
import { devices, sites } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, getRouteParentId } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { withAuth } from "@/lib/auth/with-auth";

const transferSchema = z.object({
    targetSiteId: z.string().min(1, "Target site is required"),
    targetRackId: z.string().optional().nullable(),
});

export const POST = withAuth("devices", "update", async (req, session) => {
    const deviceId = getRouteParentId(req);

    // Fetch device to verify it exists
    const device = await db.query.devices.findFirst({
        where: eq(devices.id, deviceId),
    });

    if (!device || device.deletedAt) {
        return errorResponse("Device not found", 404);
    }

    // Parse and validate request body
    const body = await req.json();
    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { targetSiteId, targetRackId } = parsed.data;

    // Verify target site exists and is not deleted
    const targetSite = await db.query.sites.findFirst({
        where: eq(sites.id, targetSiteId),
    });

    if (!targetSite || targetSite.deletedAt) {
        return errorResponse("Target site not found", 404);
    }

    // Store before state for audit log
    const before = { ...device } as Record<string, unknown>;

    // Update device: move to new rack (or unassign rack if not specified)
    const [updated] = await db
        .update(devices)
        .set({
            rackId: targetRackId ?? null,
            position: targetRackId ? device.position : null,
            updatedAt: new Date(),
        })
        .where(eq(devices.id, deviceId))
        .returning();

    const after = {
        ...updated,
        targetSiteId,
    } as Record<string, unknown>;

    // Record audit log for the site transfer
    await logAudit(
        session.user.id,
        "transfer",
        "devices",
        deviceId,
        before,
        after,
        `Transferred device to site: ${targetSite.name}`,
    );

    return successResponse(updated);
});
