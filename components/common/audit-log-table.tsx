"use client";

import type { AuditLogWithUser } from "@/types/entities";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface AuditLogTableProps {
    logs: AuditLogWithUser[];
}

function formatChanges(
    before: Record<string, unknown> | null | undefined,
    after: Record<string, unknown> | null | undefined,
): string {
    if (!before && !after) return "—";
    try {
        if (!before && after) {
            return `Created: ${JSON.stringify(after, null, 2)}`;
        }
        if (before && !after) {
            return `Deleted: ${JSON.stringify(before, null, 2)}`;
        }
        if (before && after) {
            const changedKeys = Object.keys({ ...before, ...after }).filter(
                (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
            );
            return changedKeys
                .map((key) => `${key}: ${JSON.stringify(before[key])} → ${JSON.stringify(after[key])}`)
                .join("\n");
        }
        return "—";
    } catch {
        return "—";
    }
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
    if (logs.length === 0) {
        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Changes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell
                                colSpan={4}
                                className="h-24 text-center text-muted-foreground"
                            >
                                No audit log entries.
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-48">Timestamp</TableHead>
                        <TableHead className="w-40">User</TableHead>
                        <TableHead className="w-28">Action</TableHead>
                        <TableHead>Changes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm">
                                {log.user ? (
                                    <span>{log.user.name ?? log.user.email}</span>
                                ) : (
                                    <span className="text-muted-foreground">System</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                                    {log.action}
                                </span>
                            </TableCell>
                            <TableCell>
                                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono max-w-md">
                                    {formatChanges(log.changesBefore, log.changesAfter)}
                                </pre>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
