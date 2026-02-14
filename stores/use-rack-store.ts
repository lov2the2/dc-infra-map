import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { RackWithDevices } from "@/types/entities";

interface RackState {
    activeRack: RackWithDevices | null;
    draggingDeviceId: string | null;
    dragOverSlot: number | null;
    activeFace: "front" | "rear";
    isLoading: boolean;
    setActiveRack: (rack: RackWithDevices | null) => void;
    setDraggingDevice: (id: string | null) => void;
    setDragOverSlot: (slot: number | null) => void;
    setActiveFace: (face: "front" | "rear") => void;
    moveDevice: (deviceId: string, newPosition: number) => Promise<void>;
    setLoading: (loading: boolean) => void;
}

export const useRackStore = create<RackState>()(
    immer((set, get) => ({
        activeRack: null,
        draggingDeviceId: null,
        dragOverSlot: null,
        activeFace: "front",
        isLoading: false,
        setActiveRack: (rack) => set((state) => { state.activeRack = rack; }),
        setDraggingDevice: (id) => set((state) => { state.draggingDeviceId = id; }),
        setDragOverSlot: (slot) => set((state) => { state.dragOverSlot = slot; }),
        setActiveFace: (face) => set((state) => { state.activeFace = face; }),
        moveDevice: async (deviceId, newPosition) => {
            const rack = get().activeRack;
            if (!rack) return;
            // Optimistic update
            set((state) => {
                if (!state.activeRack) return;
                const device = state.activeRack.devices.find((d) => d.id === deviceId);
                if (device) device.position = newPosition;
            });
            try {
                const res = await fetch(`/api/devices/${deviceId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ position: newPosition }),
                });
                if (!res.ok) {
                    // Revert on failure - refetch
                    const rackRes = await fetch(`/api/racks/${rack.id}`);
                    const rackData = await rackRes.json();
                    set((state) => { state.activeRack = rackData.data; });
                }
            } catch {
                // Revert on error
                const rackRes = await fetch(`/api/racks/${rack.id}`);
                const rackData = await rackRes.json();
                set((state) => { state.activeRack = rackData.data; });
            }
        },
        setLoading: (loading) => set((state) => { state.isLoading = loading; }),
    })),
);
