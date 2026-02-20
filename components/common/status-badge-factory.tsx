import { Badge } from "@/components/ui/badge";

const DEFAULT_CLASS = "bg-gray-500/15 text-gray-700 dark:text-gray-400";

/**
 * Creates a typed badge component from a color map.
 *
 * @param colorMap - Record mapping status/severity string values to Tailwind class strings
 * @returns A React component that renders a styled Badge for the given value
 *
 * @example
 * const MyBadge = createStatusBadge({
 *     active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
 *     failed: "bg-red-500/15 text-red-700 dark:text-red-400",
 * });
 */
export function createStatusBadge(colorMap: Record<string, string>) {
    return function StatusBadge({ status }: { status: string }) {
        const colorClass = colorMap[status] ?? DEFAULT_CLASS;
        return (
            <Badge variant="outline" className={colorClass}>
                {status}
            </Badge>
        );
    };
}
