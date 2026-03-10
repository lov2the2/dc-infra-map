import { TableLoading } from "@/components/common/table-loading";

export default function ManufacturersLoading() {
    return (
        <div className="container py-8 space-y-6">
            <div className="space-y-2">
                <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            </div>
            <TableLoading rows={8} columns={5} />
        </div>
    );
}
