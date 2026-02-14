import type { PowerReadingEvent } from "@/types/entities";

function generateVoltage(): number {
    // Korean DC specs: 220V ±5V
    return 220 + (Math.random() - 0.5) * 10;
}

function getLoadFactor(): number {
    const hour = new Date().getHours();
    // Business hours (9-18): higher load
    if (hour >= 9 && hour < 18) return 0.6 + Math.random() * 0.3;
    // Evening (18-23): medium load
    if (hour >= 18 && hour < 23) return 0.4 + Math.random() * 0.3;
    // Night (23-9): low load
    return 0.3 + Math.random() * 0.2;
}

export function generateMockReading(
    feedId: string,
    maxKw: number,
    feedType: string = "primary",
): PowerReadingEvent {
    const loadFactor = getLoadFactor();
    const typeMultiplier = feedType === "primary" ? 1.0 : 0.85;
    const powerKw = maxKw * loadFactor * typeMultiplier;
    const voltageV = generateVoltage();
    const powerFactor = 0.95 + Math.random() * 0.04;
    const currentA = (powerKw * 1000) / (voltageV * powerFactor);
    const energyKwh = powerKw * (5 / 3600);

    return {
        feedId,
        time: new Date().toISOString(),
        voltageV: Math.round(voltageV * 10) / 10,
        currentA: Math.round(currentA * 100) / 100,
        powerKw: Math.round(powerKw * 1000) / 1000,
        powerFactor: Math.round(powerFactor * 1000) / 1000,
        energyKwh: Math.round(energyKwh * 10000) / 10000,
    };
}

export function generateMockReadingsForFeeds(
    feeds: { id: string; ratedKw: number; feedType: string }[],
): PowerReadingEvent[] {
    return feeds.map((feed) =>
        generateMockReading(feed.id, feed.ratedKw, feed.feedType),
    );
}
