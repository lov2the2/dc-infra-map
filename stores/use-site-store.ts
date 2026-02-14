import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface Site {
    id: string;
    name: string;
    slug: string;
    status: string;
    regionId: string | null;
    tenantId: string | null;
    facility: string | null;
    address: string | null;
}

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
