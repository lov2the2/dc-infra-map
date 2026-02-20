import { eq, isNull, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { powerFeeds, racks, locations } from "@/db/schema";
import { successResponse } from "@/lib/api";
import { generateMockReading } from "@/lib/power/mock-generator";
import type { RackPowerSummary } from "@/types/entities";
import { withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    let rackIdFilter: string[] | null = null;

    // Resolve rack IDs for the given site
    if (siteId) {
        const siteLocations = await db
            .select({ id: locations.id })
            .from(locations)
            .where(eq(locations.siteId, siteId));

        if (siteLocations.length === 0) {
            return successResponse([]);
        }

        const locationIds = siteLocations.map((l) => l.id);
        const siteRacks = await db
            .select({ id: racks.id })
            .from(racks)
            .where(and(isNull(racks.deletedAt), inArray(racks.locationId, locationIds)));

        rackIdFilter = siteRacks.map((r) => r.id);

        if (rackIdFilter.length === 0) {
            return successResponse([]);
        }
    }

    const feedConditions = [isNull(powerFeeds.deletedAt)];
    if (rackIdFilter) {
        feedConditions.push(inArray(powerFeeds.rackId, rackIdFilter));
    }

    const feeds = await db.query.powerFeeds.findMany({
        where: and(...feedConditions),
        with: { rack: true },
    });

    // Group feeds by rack
    const rackMap = new Map<string, { rackName: string; feeds: typeof feeds }>();

    for (const feed of feeds) {
        if (!feed.rackId || !feed.rack) continue;
        const existing = rackMap.get(feed.rackId);
        if (existing) {
            existing.feeds.push(feed);
        } else {
            rackMap.set(feed.rackId, {
                rackName: feed.rack.name,
                feeds: [feed],
            });
        }
    }

    const summaries: RackPowerSummary[] = [];

    for (const [rackId, { rackName, feeds: rackFeeds }] of rackMap) {
        const feedSummaries = rackFeeds.map((feed) => {
            const reading = generateMockReading(feed.id, feed.ratedKw, feed.feedType);
            return {
                feedId: feed.id,
                name: feed.name,
                feedType: feed.feedType,
                maxKw: feed.ratedKw,
                currentKw: reading.powerKw,
                utilizationPercent: Math.round((reading.powerKw / feed.ratedKw) * 100),
            };
        });

        const totalMaxKw = feedSummaries.reduce((sum, f) => sum + f.maxKw, 0);
        const totalCurrentKw = feedSummaries.reduce((sum, f) => sum + f.currentKw, 0);

        summaries.push({
            rackId,
            rackName,
            feeds: feedSummaries,
            totalMaxKw,
            totalCurrentKw,
            utilizationPercent: totalMaxKw > 0 ? Math.round((totalCurrentKw / totalMaxKw) * 100) : 0,
        });
    }

    return successResponse(summaries);
});
