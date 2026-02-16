import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bell, Radio, CheckCircle } from "lucide-react";
import type { AlertStats } from "@/types/alerts";

interface AlertStatsCardProps {
    stats: AlertStats;
}

export function AlertStatsCard({ stats }: AlertStatsCardProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.enabledRules}</div>
                    <p className="text-xs text-muted-foreground">of {stats.totalRules} total</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.criticalAlerts}</div>
                    <p className="text-xs text-muted-foreground">unacknowledged</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.warningAlerts}</div>
                    <p className="text-xs text-muted-foreground">unacknowledged</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Channels</CardTitle>
                    <Radio className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalChannels}</div>
                    <p className="text-xs text-muted-foreground">notification channels</p>
                </CardContent>
            </Card>

            {stats.unacknowledgedAlerts > 0 && (
                <Card className="md:col-span-2 lg:col-span-4 border-amber-200 dark:border-amber-800">
                    <CardContent className="flex items-center gap-2 pt-4">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-sm text-amber-700 dark:text-amber-400">
                            {stats.unacknowledgedAlerts} unacknowledged alert{stats.unacknowledgedAlerts !== 1 ? "s" : ""} require attention.
                        </span>
                    </CardContent>
                </Card>
            )}

            {stats.unacknowledgedAlerts === 0 && (
                <Card className="md:col-span-2 lg:col-span-4 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="flex items-center gap-2 pt-4">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-sm text-emerald-700 dark:text-emerald-400">
                            All alerts acknowledged. System is in good standing.
                        </span>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
