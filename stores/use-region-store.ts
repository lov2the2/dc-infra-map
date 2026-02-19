import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Region } from "@/types/entities";

interface RegionState {
    regions: Region[];
    isLoading: boolean;
    setRegions: (regions: Region[]) => void;
    setLoading: (loading: boolean) => void;
}

export const useRegionStore = create<RegionState>()(
    immer((set) => ({
        regions: [],
        isLoading: false,
        setRegions: (regions) =>
            set((state) => {
                state.regions = regions;
            }),
        setLoading: (loading) =>
            set((state) => {
                state.isLoading = loading;
            }),
    })),
);
