"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { SeverityBadge } from "@/components/alerts/severity-badge";
import { useAlertStore } from "@/stores/use-alert-store";
import type { AlertHistory } from "@/types/alerts";

interface AlertHistoryTableProps {
    history: AlertHistory[];
    canAcknowledge: boolean;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function AlertHistoryTable({ history, canAcknowledge }: AlertHistoryTableProps) {
    const { acknowledgeAlert } = useAlertStore();

    const handleAcknowledge = async (id: string) => {
        await acknowledgeAlert(id);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Severity</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        {canAcknowledge && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {history.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={canAcknowledge ? 7 : 6}
                                className="h-24 text-center text-muted-foreground"
                            >
                                No alert history found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        history.map((item) => (
                            <TableRow key={item.id} className={!item.acknowledgedAt ? "bg-muted/20" : undefined}>
                                <TableCell>
                                    <SeverityBadge severity={item.severity} />
                                </TableCell>
                                <TableCell className="max-w-xs">
                                    <span className="text-sm">{item.message}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div className="font-medium">{item.resourceName}</div>
                                        <div className="text-muted-foreground">{item.resourceType}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {item.actualValue ?? "—"}
                                    {item.thresholdValue && (
                                        <span className="text-xs"> / {item.thresholdValue}</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(item.createdAt)}
                                </TableCell>
                                <TableCell>
                                    {item.acknowledgedAt ? (
                                        <div className="text-sm">
                                            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                                Acknowledged
                                            </Badge>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                by {item.acknowledgedBy}
                                            </div>
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                                            Pending
                                        </Badge>
                                    )}
                                </TableCell>
                                {canAcknowledge && (
                                    <TableCell className="text-right">
                                        {!item.acknowledgedAt && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAcknowledge(item.id)}
                                            >
                                                Acknowledge
                                            </Button>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
