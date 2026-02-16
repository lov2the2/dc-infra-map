import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CableWithTenant, TraceStep } from "@/types/cable";

interface CableFilters {
    cableType: string | null;
    status: string | null;
    search: string;
}

interface CableState {
    cables: CableWithTenant[];
    filters: CableFilters;
    tracePath: TraceStep[] | null;
    isLoading: boolean;
    error: string | null;
    fetchCables: () => Promise<void>;
    setFilter: <K extends keyof CableFilters>(key: K, value: CableFilters[K]) => void;
    resetFilters: () => void;
    createCable: (data: unknown) => Promise<void>;
    deleteCable: (id: string) => Promise<void>;
    traceCable: (portId: string) => Promise<void>;
    clearTrace: () => void;
    clearError: () => void;
    setLoading: (loading: boolean) => void;
}

const DEFAULT_FILTERS: CableFilters = {
    cableType: null,
    status: null,
    search: "",
};

export const useCableStore = create<CableState>()(
    immer((set, get) => ({
        cables: [],
        filters: { ...DEFAULT_FILTERS },
        tracePath: null,
        isLoading: false,
        error: null,
        fetchCables: async () => {
            set((state) => { state.isLoading = true; state.error = null; });
            try {
                const { cableType, status, search } = get().filters;
                const params = new URLSearchParams();
                if (cableType) params.set("cableType", cableType);
                if (status) params.set("status", status);
                if (search) params.set("search", search);
                const res = await fetch(`/api/cables?${params.toString()}`);
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to fetch cables"; });
                    return;
                }
                const json = await res.json();
                set((state) => { state.cables = json.data ?? []; });
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            } finally {
                set((state) => { state.isLoading = false; });
            }
        },
        setFilter: (key, value) =>
            set((state) => {
                state.filters[key] = value;
            }),
        resetFilters: () =>
            set((state) => {
                state.filters = { ...DEFAULT_FILTERS };
            }),
        createCable: async (data) => {
            set((state) => { state.error = null; });
            try {
                const res = await fetch("/api/cables", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to create cable"; });
                    return;
                }
                await get().fetchCables();
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            }
        },
        deleteCable: async (id) => {
            set((state) => { state.error = null; });
            try {
                const res = await fetch(`/api/cables/${id}`, { method: "DELETE" });
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to delete cable"; });
                    return;
                }
                await get().fetchCables();
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            }
        },
        traceCable: async (portId) => {
            set((state) => { state.isLoading = true; state.error = null; });
            try {
                const res = await fetch(`/api/cables/trace/${portId}`);
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    set((state) => { state.error = json.error ?? "Failed to trace cable"; });
                    return;
                }
                const json = await res.json();
                set((state) => { state.tracePath = json.data ?? null; });
            } catch (err) {
                set((state) => { state.error = err instanceof Error ? err.message : "Unknown error"; });
            } finally {
                set((state) => { state.isLoading = false; });
            }
        },
        clearTrace: () =>
            set((state) => {
                state.tracePath = null;
            }),
        clearError: () =>
            set((state) => {
                state.error = null;
            }),
        setLoading: (loading) =>
            set((state) => {
                state.isLoading = loading;
            }),
    })),
);
