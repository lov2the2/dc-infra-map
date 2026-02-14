import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Site } from "@/types/entities";

interface SiteState {
    sites: Site[];
    activeSiteId: string | null;
    isLoading: boolean;
    setSites: (sites: Site[]) => void;
    setActiveSite: (id: string | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useSiteStore = create<SiteState>()(
    immer((set) => ({
        sites: [],
        activeSiteId: null,
        isLoading: false,
        setSites: (sites) =>
            set((state) => {
                state.sites = sites;
            }),
        setActiveSite: (id) =>
            set((state) => {
                state.activeSiteId = id;
            }),
        setLoading: (loading) =>
            set((state) => {
                state.isLoading = loading;
            }),
    })),
);
