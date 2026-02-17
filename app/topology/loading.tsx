import { Skeleton } from "@/components/ui/skeleton";

export default function TopologyLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-9 w-64" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-10 w-44" />
            </div>
            <div className="rounded-md border">
                <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
    );
}
