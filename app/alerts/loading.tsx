import { Skeleton } from "@/components/ui/skeleton";
import { TableLoading } from "@/components/common/table-loading";

export default function AlertsLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-9 w-64" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
            <TableLoading />
        </div>
    );
}
