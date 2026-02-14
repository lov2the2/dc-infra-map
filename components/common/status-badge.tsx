import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    planned: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    staged: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    failed: "bg-red-500/15 text-red-700 dark:text-red-400",
    decommissioning: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    decommissioned: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
    staging: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    retired: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
};

interface StatusBadgeProps {
    status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const colorClass = STATUS_COLORS[status] ?? "bg-gray-500/15 text-gray-700 dark:text-gray-400";

    return (
        <Badge variant="outline" className={colorClass}>
            {status}
        </Badge>
    );
}
