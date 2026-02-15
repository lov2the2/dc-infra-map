"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CableStatusBadge } from "@/components/cables/cable-status-badge";
import { CableTraceView } from "@/components/cables/cable-trace-view";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Route, Trash2 } from "lucide-react";
import type { CableWithTenant, TraceStep } from "@/types/cable";

interface CableTableProps {
    cables: CableWithTenant[];
}

export function CableTable({ cables }: CableTableProps) {
    const [tracePath, setTracePath] = useState<TraceStep[] | null>(null);
    const [traceLoading, setTraceLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleTrace = async (terminationId: string) => {
        setTraceLoading(true);
        try {
            const res = await fetch(`/api/cables/trace/${terminationId}`);
            const json = await res.json();
            setTracePath(json.data ?? null);
        } finally {
            setTraceLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        await fetch(`/api/cables/${deleteId}`, { method: "DELETE" });
        setDeleteId(null);
        window.location.reload();
    };

    return (
        <>
            {tracePath && (
                <CableTraceView path={tracePath} onClose={() => setTracePath(null)} />
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Label</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Side A</TableHead>
                            <TableHead>Side B</TableHead>
                            <TableHead>Length</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cables.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No cables found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            cables.map((cable) => (
                                <TableRow key={cable.id}>
                                    <TableCell className="font-medium">{cable.label}</TableCell>
                                    <TableCell>{cable.cableType}</TableCell>
                                    <TableCell>
                                        <CableStatusBadge status={cable.status} />
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {cable.terminationAType}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {cable.terminationBType}
                                    </TableCell>
                                    <TableCell>{cable.length ? `${cable.length}m` : "—"}</TableCell>
                                    <TableCell>
                                        {cable.color ? (
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-4 w-4 rounded-full border"
                                                    style={{ backgroundColor: cable.color }}
                                                />
                                                {cable.color}
                                            </div>
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleTrace(cable.terminationAId)}
                                                disabled={traceLoading}
                                                title="Trace cable"
                                            >
                                                <Route className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteId(cable.id)}
                                                title="Delete cable"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete Cable"
                description="Are you sure you want to delete this cable? This action cannot be undone."
                onConfirm={handleDelete}
            />
        </>
    );
}
