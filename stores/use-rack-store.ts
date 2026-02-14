import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface Rack {
    id: string;
    name: string;
    locationId: string;
    type: string;
    uHeight: number;
}

interface RackState {
    racks: Rack[];
    selectedRackId: string | null;
    isLoading: boolean;
    setRacks: (racks: Rack[]) => void;
    setSelectedRack: (id: string | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useRackStore = create<RackState>()(
    immer((set) => ({
        racks: [],
        selectedRackId: null,
        isLoading: false,
        setRacks: (racks) =>
            set((state) => {
                state.racks = racks;
            }),
        setSelectedRack: (id) =>
            set((state) => {
                state.selectedRackId = id;
            }),
        setLoading: (loading) =>
            set((state) => {
                state.isLoading = loading;
            }),
    })),
);
