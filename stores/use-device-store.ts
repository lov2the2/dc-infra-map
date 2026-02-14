import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface DeviceFilters {
    status: string | null;
    tenantId: string | null;
    deviceTypeId: string | null;
    search: string;
}

interface DeviceState {
    filters: DeviceFilters;
    isLoading: boolean;
    setFilter: <K extends keyof DeviceFilters>(key: K, value: DeviceFilters[K]) => void;
    resetFilters: () => void;
    setLoading: (loading: boolean) => void;
}

const DEFAULT_FILTERS: DeviceFilters = {
    status: null,
    tenantId: null,
    deviceTypeId: null,
    search: "",
};

export const useDeviceStore = create<DeviceState>()(
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
        setLoading: (loading) =>
            set((state) => {
                state.isLoading = loading;
            }),
    })),
);
