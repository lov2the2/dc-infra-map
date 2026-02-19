"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pencil, Trash2, Plus } from "lucide-react";
import { ScheduleForm, type ReportSchedule } from "./schedule-form";

const REPORT_TYPE_LABELS: Record<ReportSchedule["reportType"], string> = {
    racks: "Rack Layout",
    devices: "Device Inventory",
    cables: "Cable Table",
    power: "Power Report",
    access: "Access Logs",
};

const FREQUENCY_LABELS: Record<ReportSchedule["frequency"], string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
};

function formatDate(value: string | null): string {
    if (!value) return "Never";
    return new Date(value).toLocaleString();
}

export function ScheduleTable() {
    const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<ReportSchedule | undefined>(undefined);
    const [runMessage, setRunMessage] = useState<{ id: string; text: string } | null>(null);

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/reports/schedules");
            if (!response.ok) throw new Error("Failed to load schedules");
            const data = await response.json();
            setSchedules(data);
        } catch {
            setError("Failed to load schedules.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    function handleNewSchedule() {
        setSelectedSchedule(undefined);
        setFormOpen(true);
    }

    function handleEditSchedule(schedule: ReportSchedule) {
        setSelectedSchedule(schedule);
        setFormOpen(true);
    }

    async function handleDelete(schedule: ReportSchedule) {
        if (!window.confirm(`Delete schedule "${schedule.name}"? This cannot be undone.`)) return;

        try {
            const response = await fetch(`/api/reports/schedules/${schedule.id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Delete failed");
            await fetchSchedules();
        } catch {
            setError("Failed to delete schedule.");
        }
    }

    async function handleRunNow(schedule: ReportSchedule) {
        setRunMessage(null);
        try {
            const response = await fetch(`/api/reports/schedules/${schedule.id}/run`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Run failed");
            setRunMessage({ id: schedule.id, text: "Report queued successfully." });
        } catch {
            setRunMessage({ id: schedule.id, text: "Failed to run report." });
        } finally {
            setTimeout(() => setRunMessage(null), 3000);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Manage automated report delivery schedules.
                </p>
                <Button size="sm" onClick={handleNewSchedule}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Schedule
                </Button>
            </div>

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Run</TableHead>
                            <TableHead>Next Run</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : schedules.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No schedules found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            schedules.map((schedule) => (
                                <TableRow key={schedule.id}>
                                    <TableCell className="font-medium">
                                        {schedule.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {REPORT_TYPE_LABELS[schedule.reportType]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {FREQUENCY_LABELS[schedule.frequency]}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            title={schedule.recipientEmails.join(", ")}
                                            className="text-sm text-muted-foreground cursor-default"
                                        >
                                            {schedule.recipientEmails.length === 0
                                                ? "None"
                                                : `${schedule.recipientEmails.length} recipient${schedule.recipientEmails.length > 1 ? "s" : ""}`}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                schedule.isActive
                                                    ? "text-emerald-600"
                                                    : "text-muted-foreground"
                                            }
                                        >
                                            {schedule.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(schedule.lastRunAt)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(schedule.nextRunAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {runMessage?.id === schedule.id && (
                                                <span className="text-xs self-center text-muted-foreground">
                                                    {runMessage.text}
                                                </span>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRunNow(schedule)}
                                                title="Run now"
                                            >
                                                <Play className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditSchedule(schedule)}
                                                title="Edit"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => handleDelete(schedule)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ScheduleForm
                open={formOpen}
                onOpenChange={setFormOpen}
                schedule={selectedSchedule}
                onSuccess={fetchSchedules}
            />
        </div>
    );
}
