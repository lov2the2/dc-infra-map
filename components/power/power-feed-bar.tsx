interface PowerFeedBarProps {
    name: string;
    feedType: string;
    currentKw: number;
    maxKw: number;
    utilizationPercent: number;
}

function getUtilizationColor(percent: number): string {
    if (percent >= 85) return "bg-red-500";
    if (percent >= 70) return "bg-amber-500";
    return "bg-emerald-500";
}

export function PowerFeedBar({ name, feedType, currentKw, maxKw, utilizationPercent }: PowerFeedBarProps) {
    const barColor = getUtilizationColor(utilizationPercent);

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                    {name}
                    <span className="ml-1.5 text-xs text-muted-foreground capitalize">({feedType})</span>
                </span>
                <span className="text-muted-foreground">
                    {currentKw.toFixed(1)} / {maxKw.toFixed(1)} kW
                </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                />
            </div>
            <div className="text-right text-xs text-muted-foreground">{utilizationPercent}%</div>
        </div>
    );
}
