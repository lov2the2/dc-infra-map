import { Badge } from "@/components/ui/badge";

const ACCESS_STATUS_COLORS: Record<string, string> = {
    checked_in: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    checked_out: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
    expired: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    denied: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const ACCESS_STATUS_LABELS: Record<string, string> = {
    checked_in: "Checked In",
    checked_out: "Checked Out",
    expired: "Expired",
    denied: "Denied",
};

interface AccessStatusBadgeProps {
    status: string;
}

export function AccessStatusBadge({ status }: AccessStatusBadgeProps) {
    const colorClass = ACCESS_STATUS_COLORS[status] ?? "bg-gray-500/15 text-gray-700 dark:text-gray-400";
    const label = ACCESS_STATUS_LABELS[status] ?? status;

    return (
        <Badge variant="outline" className={colorClass}>
            {label}
        </Badge>
    );
}
