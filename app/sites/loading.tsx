import { Skeleton } from "@/components/ui/skeleton";

export default function SitesLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-9 w-64" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-44" />
            </div>
            <div className="rounded-md border">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border-b last:border-b-0">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}
