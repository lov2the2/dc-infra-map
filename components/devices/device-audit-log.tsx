"use client";

import { useEffect, useState } from "react";
import { AuditLogTable } from "@/components/common/audit-log-table";
import type { AuditLogWithUser } from "@/types/entities";
import { Skeleton } from "@/components/ui/skeleton";

interface DeviceAuditLogProps {
    deviceId: string;
}

export function DeviceAuditLog({ deviceId }: DeviceAuditLogProps) {
    const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/audit-logs?tableName=devices&recordId=${deviceId}`)
            .then((res) => res.json())
            .then((data) => setLogs(data.data ?? []))
            .finally(() => setLoading(false));
    }, [deviceId]);

    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return <AuditLogTable logs={logs} />;
}
