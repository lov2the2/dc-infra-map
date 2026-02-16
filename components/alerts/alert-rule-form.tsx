"use client";

import { useState, useEffect } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAlertStore } from "@/stores/use-alert-store";
import type { AlertRule, AlertRuleFormData, AlertRuleType, AlertSeverity, ConditionOperator } from "@/types/alerts";

const RULE_TYPES: { value: AlertRuleType; label: string }[] = [
    { value: "power_threshold", label: "Power Threshold" },
    { value: "warranty_expiry", label: "Warranty Expiry" },
    { value: "rack_capacity", label: "Rack Capacity" },
];

const SEVERITIES: { value: AlertSeverity; label: string }[] = [
    { value: "critical", label: "Critical" },
    { value: "warning", label: "Warning" },
    { value: "info", label: "Info" },
];

const OPERATORS: { value: ConditionOperator; label: string }[] = [
    { value: "gt", label: "> (greater than)" },
    { value: "gte", label: ">= (greater or equal)" },
    { value: "lt", label: "< (less than)" },
    { value: "lte", label: "<= (less or equal)" },
    { value: "eq", label: "= (equal)" },
];

const RULE_TYPE_DEFAULTS: Record<AlertRuleType, { resource: string; conditionField: string }> = {
    power_threshold: { resource: "power_feeds", conditionField: "usage_percent" },
    warranty_expiry: { resource: "devices", conditionField: "days_until_expiry" },
    rack_capacity: { resource: "racks", conditionField: "usage_percent" },
};

const DEFAULT_FORM: AlertRuleFormData = {
    name: "",
    ruleType: "power_threshold",
    resource: "power_feeds",
    conditionField: "usage_percent",
    conditionOperator: "gt",
    thresholdValue: "",
    severity: "warning",
    enabled: true,
    notificationChannels: [],
    cooldownMinutes: 60,
};

interface AlertRuleFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rule: AlertRule | null;
    onSuccess?: () => void;
}

export function AlertRuleForm({ open, onOpenChange, rule, onSuccess }: AlertRuleFormProps) {
    const { createRule, updateRule, channels } = useAlertStore();
    const [form, setForm] = useState<AlertRuleFormData>(DEFAULT_FORM);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (rule) {
            setForm({
                name: rule.name,
                ruleType: rule.ruleType,
                resource: rule.resource,
                conditionField: rule.conditionField,
                conditionOperator: rule.conditionOperator,
                thresholdValue: rule.thresholdValue,
                severity: rule.severity,
                enabled: rule.enabled,
                notificationChannels: rule.notificationChannels,
                cooldownMinutes: rule.cooldownMinutes,
            });
        } else {
            setForm(DEFAULT_FORM);
        }
    }, [rule, open]);

    const handleRuleTypeChange = (value: AlertRuleType) => {
        const defaults = RULE_TYPE_DEFAULTS[value];
        setForm((prev) => ({
            ...prev,
            ruleType: value,
            resource: defaults.resource,
            conditionField: defaults.conditionField,
        }));
    };

    const handleChannelToggle = (channelId: string) => {
        setForm((prev) => ({
            ...prev,
            notificationChannels: prev.notificationChannels.includes(channelId)
                ? prev.notificationChannels.filter((id) => id !== channelId)
                : [...prev.notificationChannels, channelId],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (rule) {
                await updateRule(rule.id, form);
            } else {
                await createRule(form);
            }
            onOpenChange(false);
            onSuccess?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{rule ? "Edit Alert Rule" : "Create Alert Rule"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Rule Name</Label>
                        <Input
                            id="name"
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. High Power Usage"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ruleType">Rule Type</Label>
                        <Select value={form.ruleType} onValueChange={(v) => handleRuleTypeChange(v as AlertRuleType)}>
                            <SelectTrigger id="ruleType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {RULE_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="conditionOperator">Operator</Label>
                            <Select
                                value={form.conditionOperator}
                                onValueChange={(v) => setForm((prev) => ({ ...prev, conditionOperator: v as ConditionOperator }))}
                            >
                                <SelectTrigger id="conditionOperator">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {OPERATORS.map((op) => (
                                        <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="thresholdValue">
                                Threshold {form.ruleType === "warranty_expiry" ? "(days)" : "(%)"}
                            </Label>
                            <Input
                                id="thresholdValue"
                                type="number"
                                value={form.thresholdValue}
                                onChange={(e) => setForm((prev) => ({ ...prev, thresholdValue: e.target.value }))}
                                placeholder={form.ruleType === "warranty_expiry" ? "30" : "80"}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="severity">Severity</Label>
                            <Select value={form.severity} onValueChange={(v) => setForm((prev) => ({ ...prev, severity: v as AlertSeverity }))}>
                                <SelectTrigger id="severity">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEVERITIES.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cooldownMinutes">Cooldown (minutes)</Label>
                            <Input
                                id="cooldownMinutes"
                                type="number"
                                value={form.cooldownMinutes}
                                onChange={(e) => setForm((prev) => ({ ...prev, cooldownMinutes: parseInt(e.target.value) || 60 }))}
                                min={1}
                            />
                        </div>
                    </div>

                    {channels.length > 0 && (
                        <div className="space-y-2">
                            <Label>Notification Channels</Label>
                            <div className="space-y-2 rounded-md border p-3">
                                {channels.map((channel) => (
                                    <div key={channel.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`channel-${channel.id}`}
                                            checked={form.notificationChannels.includes(channel.id)}
                                            onChange={() => handleChannelToggle(channel.id)}
                                            className="rounded"
                                        />
                                        <Label htmlFor={`channel-${channel.id}`} className="font-normal cursor-pointer">
                                            {channel.name} ({channel.channelType})
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Switch
                            id="enabled"
                            checked={form.enabled}
                            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))}
                        />
                        <Label htmlFor="enabled">Enabled</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : rule ? "Save Changes" : "Create Rule"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
