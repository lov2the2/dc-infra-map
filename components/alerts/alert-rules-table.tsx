"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { SeverityBadge } from "@/components/alerts/severity-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useAlertStore } from "@/stores/use-alert-store";
import type { AlertRule } from "@/types/alerts";

const RULE_TYPE_LABELS: Record<string, string> = {
    power_threshold: "Power Threshold",
    warranty_expiry: "Warranty Expiry",
    rack_capacity: "Rack Capacity",
};

interface AlertRulesTableProps {
    rules: AlertRule[];
    onEdit: (rule: AlertRule) => void;
    canWrite: boolean;
    canDelete: boolean;
}

export function AlertRulesTable({ rules, onEdit, canWrite, canDelete }: AlertRulesTableProps) {
    const { deleteRule, toggleRule } = useAlertStore();
    const [deleteTarget, setDeleteTarget] = useState<AlertRule | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteRule(deleteTarget.id);
            setDeleteTarget(null);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleToggle = async (rule: AlertRule, enabled: boolean) => {
        await toggleRule(rule.id, enabled);
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Enabled</TableHead>
                            <TableHead>Cooldown</TableHead>
                            {(canWrite || canDelete) && (
                                <TableHead className="text-right">Actions</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No alert rules configured.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {RULE_TYPE_LABELS[rule.ruleType] ?? rule.ruleType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {rule.conditionField} {rule.conditionOperator} {rule.thresholdValue}
                                    </TableCell>
                                    <TableCell>
                                        <SeverityBadge severity={rule.severity} />
                                    </TableCell>
                                    <TableCell>
                                        {canWrite ? (
                                            <Switch
                                                checked={rule.enabled}
                                                onCheckedChange={(checked) => handleToggle(rule, checked)}
                                            />
                                        ) : (
                                            <Badge variant="outline" className={rule.enabled ? "text-emerald-600" : "text-muted-foreground"}>
                                                {rule.enabled ? "On" : "Off"}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {rule.cooldownMinutes} min
                                    </TableCell>
                                    {(canWrite || canDelete) && (
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {canWrite && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onEdit(rule)}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-destructive"
                                                        onClick={() => setDeleteTarget(rule)}
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Alert Rule"
                description={`Are you sure you want to delete the rule "${deleteTarget?.name}"? This cannot be undone.`}
                onConfirm={handleDelete}
                loading={deleteLoading}
            />
        </>
    );
}
