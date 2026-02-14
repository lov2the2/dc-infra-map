import { NextRequest } from "next/server";
import { db } from "@/db";
import { isNull } from "drizzle-orm";
import { powerFeeds } from "@/db/schema";
import { generateMockReadingsForFeeds } from "@/lib/power/mock-generator";

export async function GET(req: NextRequest) {
    const feeds = await db.query.powerFeeds.findMany({
        where: isNull(powerFeeds.deletedAt),
    });

    const feedConfigs = feeds.map((f) => ({
        id: f.id,
        ratedKw: f.ratedKw,
        feedType: f.feedType,
    }));

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            const sendData = () => {
                try {
                    const readings = generateMockReadingsForFeeds(feedConfigs);
                    const data = `data: ${JSON.stringify(readings)}\n\n`;
                    controller.enqueue(encoder.encode(data));
                } catch {
                    // Stream may be closed
                }
            };

            sendData();

            const interval = setInterval(sendData, 5000);

            req.signal.addEventListener("abort", () => {
                clearInterval(interval);
                try {
                    controller.close();
                } catch {
                    // Already closed
                }
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
