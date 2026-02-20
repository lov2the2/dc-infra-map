import { eq, isNull, and, count, inArray } from "drizzle-orm";
import { db } from "@/db";
import { sites, locations, racks, devices, powerFeeds } from "@/db/schema";
import { successResponse } from "@/lib/api";
import { generateMockReading } from "@/lib/power/mock-generator";
import { withAuthOnly } from "@/lib/auth/with-auth";

export interface SiteSummary {
    siteId: string;
    siteName: string;
    siteSlug: string;
    rackCount: number;
    deviceCount: number;
    powerUtilizationPercent: number;
}

export const GET = withAuthOnly(async (_req, _session) => {
    // Fetch all active sites
    const allSites = await db.query.sites.findMany({
        where: isNull(sites.deletedAt),
        columns: { id: true, name: true, slug: true },
    });

    if (allSites.length === 0) {
        return successResponse([]);
    }

    const summaries: SiteSummary[] = [];

    // Process each site in parallel
    await Promise.all(
        allSites.map(async (site) => {
            // Get location IDs for the site
            const siteLocations = await db
                .select({ id: locations.id })
                .from(locations)
                .where(eq(locations.siteId, site.id));

            if (siteLocations.length === 0) {
                summaries.push({
                    siteId: site.id,
                    siteName: site.name,
                    siteSlug: site.slug,
                    rackCount: 0,
                    deviceCount: 0,
                    powerUtilizationPercent: 0,
                });
                return;
            }

            const locationIds = siteLocations.map((l) => l.id);

            // Get rack count and IDs for the site
            const siteRacks = await db
                .select({ id: racks.id })
                .from(racks)
                .where(and(isNull(racks.deletedAt), inArray(racks.locationId, locationIds)));

            const rackCount = siteRacks.length;
            const rackIds = siteRacks.map((r) => r.id);

            // Get device count
            let deviceCount = 0;
            if (rackIds.length > 0) {
                const [deviceResult] = await db
                    .select({ count: count() })
                    .from(devices)
                    .where(and(isNull(devices.deletedAt), inArray(devices.rackId, rackIds)));
                deviceCount = deviceResult?.count ?? 0;
            }

            // Calculate power utilization using mock readings
            let powerUtilizationPercent = 0;
            if (rackIds.length > 0) {
                const siteFeeds = await db.query.powerFeeds.findMany({
                    where: and(isNull(powerFeeds.deletedAt), inArray(powerFeeds.rackId, rackIds)),
                });

                if (siteFeeds.length > 0) {
                    let totalMaxKw = 0;
                    let totalCurrentKw = 0;

                    for (const feed of siteFeeds) {
                        const reading = generateMockReading(feed.id, feed.ratedKw, feed.feedType);
                        totalMaxKw += feed.ratedKw;
                        totalCurrentKw += reading.powerKw;
                    }

                    powerUtilizationPercent =
                        totalMaxKw > 0
                            ? Math.round((totalCurrentKw / totalMaxKw) * 100)
                            : 0;
                }
            }

            summaries.push({
                siteId: site.id,
                siteName: site.name,
                siteSlug: site.slug,
                rackCount,
                deviceCount,
                powerUtilizationPercent,
            });
        }),
    );

    // Sort by site name for consistent ordering
    summaries.sort((a, b) => a.siteName.localeCompare(b.siteName));

    return successResponse(summaries);
});
