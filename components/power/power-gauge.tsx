interface PowerGaugeProps {
    percent: number;
    size?: number;
    label?: string;
}

function getGaugeColor(percent: number): string {
    if (percent >= 85) return "stroke-red-500";
    if (percent >= 70) return "stroke-amber-500";
    return "stroke-emerald-500";
}

export function PowerGauge({ percent, size = 120, label }: PowerGaugeProps) {
    const radius = (size - 16) / 2;
    const circumference = Math.PI * radius; // semicircle
    const offset = circumference - (circumference * Math.min(percent, 100)) / 100;
    const center = size / 2;
    const strokeColor = getGaugeColor(percent);

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
                {/* Background arc */}
                <path
                    d={`M 8 ${center} A ${radius} ${radius} 0 0 1 ${size - 8} ${center}`}
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="8"
                    strokeLinecap="round"
                />
                {/* Value arc */}
                <path
                    d={`M 8 ${center} A ${radius} ${radius} 0 0 1 ${size - 8} ${center}`}
                    fill="none"
                    className={strokeColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
                <text
                    x={center}
                    y={center - 4}
                    textAnchor="middle"
                    className="fill-foreground text-xl font-bold"
                    style={{ fontSize: size / 5 }}
                >
                    {percent}%
                </text>
            </svg>
            {label && (
                <span className="text-xs text-muted-foreground -mt-1">{label}</span>
            )}
        </div>
    );
}
