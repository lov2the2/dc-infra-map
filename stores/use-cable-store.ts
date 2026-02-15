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
    fetchCables: () => Promise<void>;
    setFilter: <K extends keyof CableFilters>(key: K, value: CableFilters[K]) => void;
    resetFilters: () => void;
    createCable: (data: unknown) => Promise<void>;
    deleteCable: (id: string) => Promise<void>;
    traceCable: (portId: string) => Promise<void>;
    clearTrace: () => void;
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
        fetchCables: async () => {
            set((state) => { state.isLoading = true; });
            try {
                const { cableType, status, search } = get().filters;
                const params = new URLSearchParams();
                if (cableType) params.set("cableType", cableType);
                if (status) params.set("status", status);
                if (search) params.set("search", search);
                const res = await fetch(`/api/cables?${params.toString()}`);
                const json = await res.json();
                set((state) => { state.cables = json.data ?? []; });
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
            const res = await fetch("/api/cables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                await get().fetchCables();
            }
        },
        deleteCable: async (id) => {
            const res = await fetch(`/api/cables/${id}`, { method: "DELETE" });
            if (res.ok) {
                await get().fetchCables();
            }
        },
        traceCable: async (portId) => {
            set((state) => { state.isLoading = true; });
            try {
                const res = await fetch(`/api/cables/trace/${portId}`);
                const json = await res.json();
                set((state) => { state.tracePath = json.data ?? null; });
            } finally {
                set((state) => { state.isLoading = false; });
            }
        },
        clearTrace: () =>
            set((state) => {
                state.tracePath = null;
            }),
        setLoading: (loading) =>
            set((state) => {
                state.isLoading = loading;
            }),
    })),
);
