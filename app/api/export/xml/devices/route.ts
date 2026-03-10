import { auth } from "@/auth";
import { db } from "@/db";
import { devices, locations, racks } from "@/db/schema";
import { isNull, and, eq, ilike, inArray } from "drizzle-orm";
import { buildXml } from "@/lib/export/xml";

export async function GET(request: Request) {
    const session = await auth();
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");
    const tenantId = searchParams.get("tenantId");
    const search = searchParams.get("search");

    const conditions = [isNull(devices.deletedAt)];
    if (status) conditions.push(eq(devices.status, status as "active"));
    if (tenantId) conditions.push(eq(devices.tenantId, tenantId));
    if (search) conditions.push(ilike(devices.name, `%${search}%`));

    if (siteId) {
        const siteLocations = await db
            .select({ id: locations.id })
            .from(locations)
            .where(eq(locations.siteId, siteId));

        if (siteLocations.length > 0) {
            const locationIds = siteLocations.map((l) => l.id);
            const siteRacks = await db
                .select({ id: racks.id })
                .from(racks)
                .where(and(isNull(racks.deletedAt), inArray(racks.locationId, locationIds)));

            if (siteRacks.length > 0) {
                conditions.push(inArray(devices.rackId, siteRacks.map((r) => r.id)));
            } else {
                conditions.push(eq(devices.rackId, "__no_match__"));
            }
        } else {
            conditions.push(eq(devices.rackId, "__no_match__"));
        }
    }

    const result = await db.query.devices.findMany({
        where: and(...conditions),
        with: {
            deviceType: { with: { manufacturer: true } },
            rack: true,
            tenant: true,
        },
    });

    const xml = buildXml({
        devices: {
            device: result.map((d) => ({
                name: d.name,
                status: d.status,
                manufacturer: d.deviceType?.manufacturer?.name ?? "",
                deviceType: d.deviceType?.model ?? "",
                rack: d.rack?.name ?? "",
                tenant: d.tenant?.name ?? "",
                serialNumber: d.serialNumber ?? "",
                assetTag: d.assetTag ?? "",
                primaryIp: d.primaryIp ?? "",
                position: d.position ?? "",
                face: d.face,
            })),
        },
    }, "dcim-export");

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml",
            "Content-Disposition": `attachment; filename="devices-export-${new Date().toISOString().split("T")[0]}.xml"`,
        },
    });
}
