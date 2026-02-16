"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useAlertStore } from "@/stores/use-alert-store";
import type { NotificationChannel, NotificationChannelType, NotificationChannelFormData } from "@/types/alerts";
import { Radio, Mail, Bell, Plus } from "lucide-react";

const CHANNEL_TYPE_ICONS: Record<NotificationChannelType, React.ComponentType<{ className?: string }>> = {
    slack_webhook: Radio,
    email: Mail,
    in_app: Bell,
};

const CHANNEL_TYPE_LABELS: Record<NotificationChannelType, string> = {
    slack_webhook: "Slack Webhook",
    email: "Email",
    in_app: "In-App",
};

const EMPTY_FORM: NotificationChannelFormData = {
    name: "",
    channelType: "slack_webhook",
    config: {},
    enabled: true,
};

interface ChannelConfigProps {
    channels: NotificationChannel[];
    canWrite: boolean;
    canDelete: boolean;
}

export function ChannelConfig({ channels, canWrite, canDelete }: ChannelConfigProps) {
    const { createChannel, updateChannel, deleteChannel } = useAlertStore();
    const [formOpen, setFormOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
    const [form, setForm] = useState<NotificationChannelFormData>(EMPTY_FORM);
    const [deleteTarget, setDeleteTarget] = useState<NotificationChannel | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const openCreate = () => {
        setEditingChannel(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
    };

    const openEdit = (channel: NotificationChannel) => {
        setEditingChannel(channel);
        setForm({
            name: channel.name,
            channelType: channel.channelType,
            config: { ...channel.config },
            enabled: channel.enabled,
        });
        setFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingChannel) {
                await updateChannel(editingChannel.id, form);
            } else {
                await createChannel(form);
            }
            setFormOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteChannel(deleteTarget.id);
            setDeleteTarget(null);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                {canWrite && (
                    <div className="flex justify-end">
                        <Button onClick={openCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Channel
                        </Button>
                    </div>
                )}

                {channels.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No notification channels configured.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {channels.map((channel) => {
                            const Icon = CHANNEL_TYPE_ICONS[channel.channelType] ?? Bell;
                            return (
                                <Card key={channel.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                <CardTitle className="text-base">{channel.name}</CardTitle>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={channel.enabled ? "text-emerald-600" : "text-muted-foreground"}
                                            >
                                                {channel.enabled ? "Active" : "Disabled"}
                                            </Badge>
                                        </div>
                                        <CardDescription>{CHANNEL_TYPE_LABELS[channel.channelType]}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="text-xs text-muted-foreground">
                                            {channel.channelType === "slack_webhook" && (
                                                <span>Webhook: {channel.config.webhookUrl ? "Configured" : "Not set"}</span>
                                            )}
                                            {channel.channelType === "email" && (
                                                <span>Recipients: {channel.config.emailAddresses || "Not set"}</span>
                                            )}
                                            {channel.channelType === "in_app" && (
                                                <span>In-app notification delivery</span>
                                            )}
                                        </div>
                                        {(canWrite || canDelete) && (
                                            <div className="flex gap-2 pt-2">
                                                {canWrite && (
                                                    <Button variant="outline" size="sm" onClick={() => openEdit(channel)}>
                                                        Edit
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-destructive"
                                                        onClick={() => setDeleteTarget(channel)}
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingChannel ? "Edit Channel" : "Add Notification Channel"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="channelName">Name</Label>
                            <Input
                                id="channelName"
                                value={form.name}
                                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Ops Slack"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="channelType">Type</Label>
                            <Select
                                value={form.channelType}
                                onValueChange={(v) => setForm((prev) => ({ ...prev, channelType: v as NotificationChannelType, config: {} }))}
                            >
                                <SelectTrigger id="channelType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="slack_webhook">Slack Webhook</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="in_app">In-App</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {form.channelType === "slack_webhook" && (
                            <div className="space-y-2">
                                <Label htmlFor="webhookUrl">Webhook URL</Label>
                                <Input
                                    id="webhookUrl"
                                    value={form.config.webhookUrl ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, config: { ...prev.config, webhookUrl: e.target.value } }))
                                    }
                                    placeholder="https://hooks.slack.com/services/..."
                                />
                            </div>
                        )}

                        {form.channelType === "email" && (
                            <div className="space-y-2">
                                <Label htmlFor="emailAddresses">Email Addresses (comma-separated)</Label>
                                <Input
                                    id="emailAddresses"
                                    value={form.config.emailAddresses ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, config: { ...prev.config, emailAddresses: e.target.value } }))
                                    }
                                    placeholder="noc@example.com, alerts@example.com"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Switch
                                id="channelEnabled"
                                checked={form.enabled}
                                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))}
                            />
                            <Label htmlFor="channelEnabled">Enabled</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : editingChannel ? "Save Changes" : "Add Channel"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Channel"
                description={`Are you sure you want to delete the channel "${deleteTarget?.name}"?`}
                onConfirm={handleDelete}
                loading={deleteLoading}
            />
        </>
    );
}
