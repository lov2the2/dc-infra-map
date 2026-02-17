import { Skeleton } from "@/components/ui/skeleton";

export default function PowerLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-9 w-64" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-md border p-6 space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                        <Skeleton className="h-3 w-32 mx-auto" />
                    </div>
                ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-md border p-4 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
