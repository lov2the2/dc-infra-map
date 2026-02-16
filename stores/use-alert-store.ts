import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
    AlertRule,
    AlertHistory,
    NotificationChannel,
    AlertStats,
    AlertRuleFormData,
    NotificationChannelFormData,
} from "@/types/alerts";

interface AlertState {
    rules: AlertRule[];
    history: AlertHistory[];
    channels: NotificationChannel[];
    isLoading: boolean;
    error: string | null;

    // Rules
    fetchRules: () => Promise<void>;
    createRule: (data: AlertRuleFormData) => Promise<void>;
    updateRule: (id: string, data: Partial<AlertRuleFormData>) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;
    toggleRule: (id: string, enabled: boolean) => Promise<void>;

    // History
    fetchHistory: () => Promise<void>;
    acknowledgeAlert: (id: string) => Promise<void>;

    // Channels
    fetchChannels: () => Promise<void>;
    createChannel: (data: NotificationChannelFormData) => Promise<void>;
    updateChannel: (id: string, data: Partial<NotificationChannelFormData>) => Promise<void>;
    deleteChannel: (id: string) => Promise<void>;

    // Evaluate
    evaluateRules: () => Promise<{ count: number }>;

    // Computed
    getStats: () => AlertStats;

    // Error
    clearError: () => void;
}

export const useAlertStore = create<AlertState>()(
    immer((set, get) => ({
        rules: [],
        history: [],
        channels: [],
        isLoading: false,
        error: null,

        fetchRules: async () => {
            set((state) => { state.isLoading = true; state.error = null; });
            try {
                const res = await fetch("/api/alerts/rules");
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to fetch rules"; });
                    return;
                }
                const json = await res.json();
                set((state) => { state.rules = json.data ?? []; });
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            } finally {
                set((state) => { state.isLoading = false; });
            }
        },

        createRule: async (data) => {
            set((state) => { state.error = null; });
            try {
                const res = await fetch("/api/alerts/rules", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to create rule"; });
                    return;
                }
                await get().fetchRules();
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            }
        },

        updateRule: async (id, data) => {
            set((state) => { state.error = null; });
            try {
                const res = await fetch(`/api/alerts/rules/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to update rule"; });
                    return;
                }
                await get().fetchRules();
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            }
        },

        deleteRule: async (id) => {
            set((state) => { state.error = null; });
            try {
                const res = await fetch(`/api/alerts/rules/${id}`, { method: "DELETE" });
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to delete rule"; });
                    return;
                }
                await get().fetchRules();
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            }
        },

        toggleRule: async (id, enabled) => {
            await get().updateRule(id, { enabled });
        },

        fetchHistory: async () => {
            set((state) => { state.isLoading = true; state.error = null; });
            try {
                const res = await fetch("/api/alerts/history");
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to fetch history"; });
                    return;
                }
                const json = await res.json();
                set((state) => { state.history = json.data ?? []; });
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            } finally {
                set((state) => { state.isLoading = false; });
            }
        },

        acknowledgeAlert: async (id) => {
            set((state) => { state.error = null; });
            try {
                const res = await fetch(`/api/alerts/history/${id}/acknowledge`, { method: "PATCH" });
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to acknowledge alert"; });
                    return;
                }
                await get().fetchHistory();
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            }
        },

        fetchChannels: async () => {
            set((state) => { state.isLoading = true; state.error = null; });
            try {
                const res = await fetch("/api/alerts/channels");
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to fetch channels"; });
                    return;
                }
                const json = await res.json();
                set((state) => { state.channels = json.data ?? []; });
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            } finally {
                set((state) => { state.isLoading = false; });
            }
        },

        createChannel: async (data) => {
            set((state) => { state.error = null; });
            try {
                const res = await fetch("/api/alerts/channels", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to create channel"; });
                    return;
                }
                await get().fetchChannels();
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            }
        },

        updateChannel: async (id, data) => {
            set((state) => { state.error = null; });
            try {
                const res = await fetch(`/api/alerts/channels/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to update channel"; });
                    return;
                }
                await get().fetchChannels();
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            }
        },

        deleteChannel: async (id) => {
            set((state) => { state.error = null; });
            try {
                const res = await fetch(`/api/alerts/channels/${id}`, { method: "DELETE" });
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to delete channel"; });
                    return;
                }
                await get().fetchChannels();
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            }
        },

        evaluateRules: async () => {
            set((state) => { state.error = null; });
            try {
                const res = await fetch("/api/alerts/evaluate", { method: "POST" });
                const json = await res.json();
                if (!res.ok) {
                    set((state) => { state.error = json.error ?? "Failed to evaluate rules"; });
                    return { count: 0 };
                }
                await get().fetchHistory();
                return { count: json.data?.count ?? 0 };
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
                return { count: 0 };
            }
        },

        getStats: () => {
            const { rules, history, channels } = get();
            const unacknowledged = history.filter((h) => !h.acknowledgedAt);
            return {
                totalRules: rules.length,
                enabledRules: rules.filter((r) => r.enabled).length,
                totalChannels: channels.length,
                criticalAlerts: unacknowledged.filter((h) => h.severity === "critical").length,
                warningAlerts: unacknowledged.filter((h) => h.severity === "warning").length,
                unacknowledgedAlerts: unacknowledged.length,
            };
        },

        clearError: () =>
            set((state) => {
                state.error = null;
            }),
    }))
);
