import { Skeleton } from "@/components/ui/skeleton";

interface TableLoadingProps {
    rows?: number;
    columns?: number;
}

export function TableLoading({ rows = 6, columns = 4 }: TableLoadingProps) {
    const colWidths = ["w-40", "w-32", "w-24", "w-20", "w-24", "w-16"];

    return (
        <div className="rounded-md border">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border-b last:border-b-0">
                    {Array.from({ length: columns }).map((_, j) => (
                        <Skeleton key={j} className={`h-5 ${colWidths[j] ?? "w-24"}`} />
                    ))}
                </div>
            ))}
        </div>
    );
}
