"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/page-header";
import { AlertStatsCard } from "@/components/alerts/alert-stats-card";
import { AlertRulesTable } from "@/components/alerts/alert-rules-table";
import { AlertRuleForm } from "@/components/alerts/alert-rule-form";
import { AlertHistoryTable } from "@/components/alerts/alert-history-table";
import { ChannelConfig } from "@/components/alerts/channel-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAlertStore } from "@/stores/use-alert-store";
import type { AlertRule } from "@/types/alerts";
import { Play, Plus } from "lucide-react";

// Hardcoded mock session role for demo — in production, read from session cookie/context
const DEMO_ROLE = "admin";

function canWriteAlertRules(role: string): boolean {
    return role === "admin" || role === "operator";
}

function canDeleteAlertRules(role: string): boolean {
    return role === "admin";
}

function canManageChannels(role: string): boolean {
    return role === "admin";
}

function canAcknowledge(role: string): boolean {
    return role === "admin" || role === "operator";
}

export default function AlertsPage() {
    const { rules, history, channels, fetchRules, fetchHistory, fetchChannels, evaluateRules, getStats } = useAlertStore();
    const [ruleFormOpen, setRuleFormOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
    const [evaluating, setEvaluating] = useState(false);
    const [activeTab, setActiveTab] = useState("rules");

    const loadAll = useCallback(async () => {
        await Promise.all([fetchRules(), fetchHistory(), fetchChannels()]);
    }, [fetchRules, fetchHistory, fetchChannels]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const handleEvaluate = async () => {
        setEvaluating(true);
        try {
            const result = await evaluateRules();
            if (result.count > 0) {
                setActiveTab("history");
            }
        } finally {
            setEvaluating(false);
        }
    };

    const handleEditRule = (rule: AlertRule) => {
        setEditingRule(rule);
        setRuleFormOpen(true);
    };

    const handleCreateRule = () => {
        setEditingRule(null);
        setRuleFormOpen(true);
    };

    const stats = getStats();
    const writeRules = canWriteAlertRules(DEMO_ROLE);
    const deleteRules = canDeleteAlertRules(DEMO_ROLE);
    const manageChannels = canManageChannels(DEMO_ROLE);
    const acknowledge = canAcknowledge(DEMO_ROLE);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Alerts"
                description="Monitor and manage infrastructure alerts and notification channels."
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Alerts" },
                ]}
                action={
                    <div className="flex items-center gap-2">
                        {DEMO_ROLE === "admin" && (
                            <Button
                                variant="outline"
                                onClick={handleEvaluate}
                                disabled={evaluating}
                            >
                                <Play className="h-4 w-4 mr-2" />
                                {evaluating ? "Evaluating..." : "Run Evaluation"}
                            </Button>
                        )}
                        {writeRules && (
                            <Button onClick={handleCreateRule}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Rule
                            </Button>
                        )}
                    </div>
                }
            />

            <AlertStatsCard stats={stats} />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="rules">Alert Rules ({rules.length})</TabsTrigger>
                    <TabsTrigger value="history">
                        History ({history.filter((h) => !h.acknowledgedAt).length} pending)
                    </TabsTrigger>
                    <TabsTrigger value="channels">Channels ({channels.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="mt-4">
                    <AlertRulesTable
                        rules={rules}
                        onEdit={handleEditRule}
                        canWrite={writeRules}
                        canDelete={deleteRules}
                    />
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <AlertHistoryTable
                        history={history}
                        canAcknowledge={acknowledge}
                    />
                </TabsContent>

                <TabsContent value="channels" className="mt-4">
                    <ChannelConfig
                        channels={channels}
                        canWrite={manageChannels}
                        canDelete={manageChannels}
                    />
                </TabsContent>
            </Tabs>

            <AlertRuleForm
                open={ruleFormOpen}
                onOpenChange={setRuleFormOpen}
                rule={editingRule}
                onSuccess={fetchRules}
            />
        </div>
    );
}
