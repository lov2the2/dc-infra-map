import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { powerFeeds } from "@/db/schema";
import { successResponse } from "@/lib/api";
import { generateMockReading } from "@/lib/power/mock-generator";
import type { RackPowerSummary } from "@/types/entities";
import { withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (_req, _session) => {
    const feeds = await db.query.powerFeeds.findMany({
        where: isNull(powerFeeds.deletedAt),
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
