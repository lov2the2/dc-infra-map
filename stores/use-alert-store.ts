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
}

export const useAlertStore = create<AlertState>()(
    immer((set, get) => ({
        rules: [],
        history: [],
        channels: [],
        isLoading: false,

        fetchRules: async () => {
            set((state) => { state.isLoading = true; });
            try {
                const res = await fetch("/api/alerts/rules");
                const json = await res.json();
                set((state) => { state.rules = json.data ?? []; });
            } finally {
                set((state) => { state.isLoading = false; });
            }
        },

        createRule: async (data) => {
            const res = await fetch("/api/alerts/rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                await get().fetchRules();
            }
        },

        updateRule: async (id, data) => {
            const res = await fetch(`/api/alerts/rules/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                await get().fetchRules();
            }
        },

        deleteRule: async (id) => {
            const res = await fetch(`/api/alerts/rules/${id}`, { method: "DELETE" });
            if (res.ok) {
                await get().fetchRules();
            }
        },

        toggleRule: async (id, enabled) => {
            await get().updateRule(id, { enabled });
        },

        fetchHistory: async () => {
            set((state) => { state.isLoading = true; });
            try {
                const res = await fetch("/api/alerts/history");
                const json = await res.json();
                set((state) => { state.history = json.data ?? []; });
            } finally {
                set((state) => { state.isLoading = false; });
            }
        },

        acknowledgeAlert: async (id) => {
            const res = await fetch(`/api/alerts/history/${id}/acknowledge`, { method: "PATCH" });
            if (res.ok) {
                await get().fetchHistory();
            }
        },

        fetchChannels: async () => {
            set((state) => { state.isLoading = true; });
            try {
                const res = await fetch("/api/alerts/channels");
                const json = await res.json();
                set((state) => { state.channels = json.data ?? []; });
            } finally {
                set((state) => { state.isLoading = false; });
            }
        },

        createChannel: async (data) => {
            const res = await fetch("/api/alerts/channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                await get().fetchChannels();
            }
        },

        updateChannel: async (id, data) => {
            const res = await fetch(`/api/alerts/channels/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                await get().fetchChannels();
            }
        },

        deleteChannel: async (id) => {
            const res = await fetch(`/api/alerts/channels/${id}`, { method: "DELETE" });
            if (res.ok) {
                await get().fetchChannels();
            }
        },

        evaluateRules: async () => {
            const res = await fetch("/api/alerts/evaluate", { method: "POST" });
            const json = await res.json();
            if (res.ok) {
                await get().fetchHistory();
                return { count: json.data?.count ?? 0 };
            }
            return { count: 0 };
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
    }))
);
