import { createStatusBadge } from "@/components/common/status-badge-factory";
import type { AlertSeverity } from "@/types/alerts";

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
    critical: "bg-red-500/15 text-red-700 dark:text-red-400",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    info: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

const SeverityBadgeInner = createStatusBadge(SEVERITY_STYLES as Record<string, string>);

export function SeverityBadge({ severity }: { severity: AlertSeverity | string }) {
    return <SeverityBadgeInner status={severity} />;
}
