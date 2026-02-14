import { Skeleton } from "@/components/ui/skeleton";

export default function RackLoading() {
    return (
        <div className="container py-8 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-[calc(42*1.75rem)] w-96 rounded-lg" />
        </div>
    );
}
