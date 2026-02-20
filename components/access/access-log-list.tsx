"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AccessStatusBadge } from "./access-status-badge";
import { formatDateTimeOptions } from "@/lib/data-formatters";
import type { AccessLogWithUser } from "@/types/entities";

interface AccessLogListProps {
    logs: AccessLogWithUser[];
}

export function AccessLogList({ logs }: AccessLogListProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No access logs found
                        </TableCell>
                    </TableRow>
                ) : (
                    logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.personnelName}</TableCell>
                            <TableCell>{log.company ?? "-"}</TableCell>
                            <TableCell className="capitalize">{log.accessType}</TableCell>
                            <TableCell>
                                <AccessStatusBadge status={log.status} />
                            </TableCell>
                            <TableCell>{log.site?.name ?? "-"}</TableCell>
                            <TableCell>
                                {formatDateTimeOptions(log.checkInAt, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </TableCell>
                            <TableCell>
                                {formatDateTimeOptions(log.actualCheckOutAt, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/access/${log.id}`}>View</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
