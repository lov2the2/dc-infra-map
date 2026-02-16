import { Badge } from "@/components/ui/badge";
import type { AlertSeverity } from "@/types/alerts";

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
    critical: "bg-red-500/15 text-red-700 dark:text-red-400",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    info: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

interface SeverityBadgeProps {
    severity: AlertSeverity | string;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
    const colorClass = SEVERITY_STYLES[severity as AlertSeverity] ?? "bg-gray-500/15 text-gray-700 dark:text-gray-400";
    return (
        <Badge variant="outline" className={colorClass}>
            {severity}
        </Badge>
    );
}
