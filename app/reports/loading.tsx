import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-9 w-64" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-md border p-6 space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                ))}
            </div>
        </div>
    );
}
