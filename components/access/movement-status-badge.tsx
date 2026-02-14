import { Badge } from "@/components/ui/badge";

const MOVEMENT_STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    approved: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    in_progress: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
    completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    rejected: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const MOVEMENT_STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    in_progress: "In Progress",
    completed: "Completed",
    rejected: "Rejected",
};

interface MovementStatusBadgeProps {
    status: string;
}

export function MovementStatusBadge({ status }: MovementStatusBadgeProps) {
    const colorClass = MOVEMENT_STATUS_COLORS[status] ?? "bg-gray-500/15 text-gray-700 dark:text-gray-400";
    const label = MOVEMENT_STATUS_LABELS[status] ?? status;

    return (
        <Badge variant="outline" className={colorClass}>
            {label}
        </Badge>
    );
}
