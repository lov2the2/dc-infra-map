"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export interface ReportSchedule {
    id: string;
    name: string;
    reportType: "racks" | "devices" | "cables" | "power" | "access";
    frequency: "daily" | "weekly" | "monthly";
    cronExpression: string;
    recipientEmails: string[];
    isActive: boolean;
    lastRunAt: string | null;
    nextRunAt: string | null;
    createdAt: string;
}

interface ScheduleFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    schedule?: ReportSchedule;
    onSuccess: () => void;
}

const CRON_PRESETS: Record<string, string> = {
    daily: "0 8 * * *",
    weekly: "0 8 * * 1",
    monthly: "0 8 1 * *",
};

export function ScheduleForm({
    open,
    onOpenChange,
    schedule,
    onSuccess,
}: ScheduleFormProps) {
    const [name, setName] = useState("");
    const [reportType, setReportType] = useState<ReportSchedule["reportType"]>("devices");
    const [frequency, setFrequency] = useState<ReportSchedule["frequency"]>("daily");
    const [cronExpression, setCronExpression] = useState(CRON_PRESETS.daily);
    const [recipientEmails, setRecipientEmails] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (schedule) {
            setName(schedule.name);
            setReportType(schedule.reportType);
            setFrequency(schedule.frequency);
            setCronExpression(schedule.cronExpression);
            setRecipientEmails(schedule.recipientEmails.join(", "));
            setIsActive(schedule.isActive);
        } else {
            setName("");
            setReportType("devices");
            setFrequency("daily");
            setCronExpression(CRON_PRESETS.daily);
            setRecipientEmails("");
            setIsActive(true);
        }
    }, [schedule, open]);

    function handleFrequencyChange(value: ReportSchedule["frequency"]) {
        setFrequency(value);
        setCronExpression(CRON_PRESETS[value]);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const emails = recipientEmails
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean);

        const payload = {
            name,
            reportType,
            frequency,
            cronExpression,
            recipientEmails: emails,
            isActive,
        };

        try {
            const url = schedule
                ? `/api/reports/schedules/${schedule.id}`
                : "/api/reports/schedules";
            const method = schedule ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to save schedule");

            onSuccess();
            onOpenChange(false);
        } catch {
            // Error feedback via failed save — user can retry
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>
                        {schedule ? "Edit Schedule" : "New Schedule"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="schedule-name">Name</Label>
                        <Input
                            id="schedule-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Weekly device report"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="report-type">Report Type</Label>
                        <Select
                            value={reportType}
                            onValueChange={(value) =>
                                setReportType(value as ReportSchedule["reportType"])
                            }
                        >
                            <SelectTrigger id="report-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="racks">Rack Layout</SelectItem>
                                <SelectItem value="devices">Device Inventory</SelectItem>
                                <SelectItem value="cables">Cable Table</SelectItem>
                                <SelectItem value="power">Power Report</SelectItem>
                                <SelectItem value="access">Access Logs</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select value={frequency} onValueChange={handleFrequencyChange}>
                            <SelectTrigger id="frequency">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cron-expression">Cron Expression</Label>
                        <Input
                            id="cron-expression"
                            value={cronExpression}
                            onChange={(e) => setCronExpression(e.target.value)}
                            placeholder="0 8 * * *"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="recipient-emails">Recipient Emails</Label>
                        <Textarea
                            id="recipient-emails"
                            value={recipientEmails}
                            onChange={(e) => setRecipientEmails(e.target.value)}
                            placeholder="user@example.com, admin@example.com"
                            rows={2}
                        />
                        <p className="text-xs text-muted-foreground">
                            Separate multiple addresses with commas.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="is-active"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                        <Label htmlFor="is-active">Active</Label>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {schedule ? "Save Changes" : "Create Schedule"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
