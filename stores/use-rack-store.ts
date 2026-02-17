import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { RackWithDevices } from "@/types/entities";

interface RackState {
    activeRack: RackWithDevices | null;
    racks: RackWithDevices[];
    draggingDeviceId: string | null;
    dragOverSlot: number | null;
    activeFace: "front" | "rear";
    isLoading: boolean;
    setActiveRack: (rack: RackWithDevices | null) => void;
    setRacks: (racks: RackWithDevices[]) => void;
    setDraggingDevice: (id: string | null) => void;
    setDragOverSlot: (slot: number | null) => void;
    setActiveFace: (face: "front" | "rear") => void;
    moveDevice: (deviceId: string, newPosition: number) => Promise<void>;
    moveDeviceBetweenRacks: (deviceId: string, sourceRackId: string, targetRackId: string, newPosition: number) => Promise<void>;
    setLoading: (loading: boolean) => void;
}

export const useRackStore = create<RackState>()(
    immer((set, get) => ({
        activeRack: null,
        racks: [],
        draggingDeviceId: null,
        dragOverSlot: null,
        activeFace: "front",
        isLoading: false,
        setActiveRack: (rack) => set((state) => { state.activeRack = rack; }),
        setRacks: (racks) => set((state) => { state.racks = racks as RackWithDevices[]; }),
        setDraggingDevice: (id) => set((state) => { state.draggingDeviceId = id; }),
        setDragOverSlot: (slot) => set((state) => { state.dragOverSlot = slot; }),
        setActiveFace: (face) => set((state) => { state.activeFace = face; }),
        moveDevice: async (deviceId, newPosition) => {
            const rack = get().activeRack;
            if (!rack) return;
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
                    const rackRes = await fetch(`/api/racks/${rack.id}`);
                    const rackData = await rackRes.json();
                    set((state) => { state.activeRack = rackData.data; });
                }
            } catch {
                const rackRes = await fetch(`/api/racks/${rack.id}`);
                const rackData = await rackRes.json();
                set((state) => { state.activeRack = rackData.data; });
            }
        },
        moveDeviceBetweenRacks: async (deviceId, sourceRackId, targetRackId, newPosition) => {
            // Optimistic update: move device from source to target rack in racks array
            set((state) => {
                const sourceRack = state.racks.find((r) => r.id === sourceRackId);
                const targetRack = state.racks.find((r) => r.id === targetRackId);
                if (!sourceRack || !targetRack) return;
                const deviceIdx = sourceRack.devices.findIndex((d) => d.id === deviceId);
                if (deviceIdx === -1) return;
                const [device] = sourceRack.devices.splice(deviceIdx, 1);
                device.position = newPosition;
                device.rackId = targetRackId;
                targetRack.devices.push(device);
            });
            try {
                const res = await fetch(`/api/devices/${deviceId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rackId: targetRackId, position: newPosition }),
                });
                if (!res.ok) {
                    const [srcRes, tgtRes] = await Promise.all([
                        fetch(`/api/racks/${sourceRackId}`),
                        fetch(`/api/racks/${targetRackId}`),
                    ]);
                    const srcData = await srcRes.json();
                    const tgtData = await tgtRes.json();
                    set((state) => {
                        const srcIdx = state.racks.findIndex((r) => r.id === sourceRackId);
                        const tgtIdx = state.racks.findIndex((r) => r.id === targetRackId);
                        if (srcIdx !== -1) state.racks[srcIdx] = srcData.data;
                        if (tgtIdx !== -1) state.racks[tgtIdx] = tgtData.data;
                    });
                }
            } catch {
                const [srcRes, tgtRes] = await Promise.all([
                    fetch(`/api/racks/${sourceRackId}`),
                    fetch(`/api/racks/${targetRackId}`),
                ]);
                const srcData = await srcRes.json();
                const tgtData = await tgtRes.json();
                set((state) => {
                    const srcIdx = state.racks.findIndex((r) => r.id === sourceRackId);
                    const tgtIdx = state.racks.findIndex((r) => r.id === targetRackId);
                    if (srcIdx !== -1) state.racks[srcIdx] = srcData.data;
                    if (tgtIdx !== -1) state.racks[tgtIdx] = tgtData.data;
                });
            }
        },
        setLoading: (loading) => set((state) => { state.isLoading = loading; }),
    })),
);
