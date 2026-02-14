import type { PowerReadingEvent } from "@/types/entities";

interface PowerChartProps {
    readings: PowerReadingEvent[];
    width?: number;
    height?: number;
    dataKey?: "powerKw" | "voltageV" | "currentA";
}

export function PowerChart({ readings, width = 600, height = 200, dataKey = "powerKw" }: PowerChartProps) {
    if (readings.length < 2) {
        return (
            <div className="flex items-center justify-center text-muted-foreground" style={{ width, height }}>
                Not enough data points
            </div>
        );
    }

    const values = readings.map((r) => r[dataKey]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = readings.map((r, i) => {
        const x = padding.left + (i / (readings.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - ((r[dataKey] - minVal) / range) * chartHeight;
        return `${x},${y}`;
    });

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p}`).join(" ");

    // Y-axis labels
    const yLabels = [maxVal, (maxVal + minVal) / 2, minVal].map((val) => ({
        value: val.toFixed(1),
        y: padding.top + chartHeight - ((val - minVal) / range) * chartHeight,
    }));

    const unit = dataKey === "powerKw" ? "kW" : dataKey === "voltageV" ? "V" : "A";

    return (
        <svg width={width} height={height} className="overflow-visible">
            {/* Grid lines */}
            {yLabels.map((label, i) => (
                <g key={i}>
                    <line
                        x1={padding.left}
                        y1={label.y}
                        x2={width - padding.right}
                        y2={label.y}
                        className="stroke-muted"
                        strokeDasharray="4 4"
                    />
                    <text
                        x={padding.left - 8}
                        y={label.y + 4}
                        textAnchor="end"
                        className="fill-muted-foreground"
                        style={{ fontSize: 11 }}
                    >
                        {label.value}
                    </text>
                </g>
            ))}

            {/* Data line */}
            <path
                d={pathD}
                fill="none"
                className="stroke-primary"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Unit label */}
            <text
                x={padding.left - 8}
                y={padding.top - 8}
                textAnchor="end"
                className="fill-muted-foreground"
                style={{ fontSize: 10 }}
            >
                {unit}
            </text>
        </svg>
    );
}
