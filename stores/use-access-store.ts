import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface AccessFilters {
    siteId: string | null;
    status: string | null;
    accessType: string | null;
    dateFrom: string | null;
    dateTo: string | null;
}

interface AccessState {
    filters: AccessFilters;
    isLoading: boolean;
    setFilter: <K extends keyof AccessFilters>(key: K, value: AccessFilters[K]) => void;
    resetFilters: () => void;
    checkIn: (data: Record<string, unknown>) => Promise<boolean>;
    checkOut: (id: string, note?: string) => Promise<boolean>;
}

const DEFAULT_FILTERS: AccessFilters = {
    siteId: null,
    status: null,
    accessType: null,
    dateFrom: null,
    dateTo: null,
};

export const useAccessStore = create<AccessState>()(
    immer((set) => ({
        filters: { ...DEFAULT_FILTERS },
        isLoading: false,

        setFilter: (key, value) =>
            set((state) => {
                state.filters[key] = value;
            }),

        resetFilters: () =>
            set((state) => {
                state.filters = { ...DEFAULT_FILTERS };
            }),

        checkIn: async (data) => {
            set((state) => {
                state.isLoading = true;
            });
            try {
                const res = await fetch("/api/access-logs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                return res.ok;
            } catch {
                return false;
            } finally {
                set((state) => {
                    state.isLoading = false;
                });
            }
        },

        checkOut: async (id, note) => {
            set((state) => {
                state.isLoading = true;
            });
            try {
                const res = await fetch(`/api/access-logs/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ checkOutNote: note }),
                });
                return res.ok;
            } catch {
                return false;
            } finally {
                set((state) => {
                    state.isLoading = false;
                });
            }
        },
    })),
);
