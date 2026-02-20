import { createStatusBadge } from "@/components/common/status-badge-factory";

const CABLE_STATUS_COLORS: Record<string, string> = {
    connected: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    planned: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    decommissioned: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
};

export const CableStatusBadge = createStatusBadge(CABLE_STATUS_COLORS);
