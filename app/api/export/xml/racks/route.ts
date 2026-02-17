import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { buildXml } from "@/lib/export/xml";
import { withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (_req, _session) => {
    const result = await db.query.sites.findMany({
        where: isNull(sites.deletedAt),
        with: {
            locations: {
                with: {
                    racks: {
                        with: {
                            devices: {
                                with: {
                                    deviceType: true,
                                    interfaces: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const siteNodes = result.map((site) => ({
        "@_id": site.id,
        "@_name": site.name,
        location: site.locations.map((loc) => ({
            "@_id": loc.id,
            "@_name": loc.name,
            rack: loc.racks.map((rack) => ({
                "@_id": rack.id,
                "@_name": rack.name,
                "@_uHeight": rack.uHeight,
                device: rack.devices.map((dev) => ({
                    "@_position": dev.position ?? "",
                    "@_height": dev.deviceType.uHeight,
                    "@_name": dev.name,
                    "@_type": dev.deviceType.model,
                    "@_status": dev.status,
                    interfaces: {
                        interface: dev.interfaces.map((iface) => ({
                            "@_name": iface.name,
                            "@_type": iface.interfaceType,
                        })),
                    },
                })),
            })),
        })),
    }));

    const xml = buildXml({ site: siteNodes }, "dcim");

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml",
            "Content-Disposition": `attachment; filename="dcim-racks-${new Date().toISOString().split("T")[0]}.xml"`,
        },
    });
});
