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
    updateRackPosition: (rackId: string, posX: number, posY: number) => Promise<void>;
    updateDevice: (deviceId: string, updates: Record<string, unknown>) => Promise<void>;
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
                    try {
                        const [srcRes, tgtRes] = await Promise.all([
                            fetch(`/api/racks/${sourceRackId}`),
                            fetch(`/api/racks/${targetRackId}`),
                        ]);
                        if (srcRes.ok && tgtRes.ok) {
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
                        // Rollback fetch failed silently
                    }
                }
            } catch {
                try {
                    const [srcRes, tgtRes] = await Promise.all([
                        fetch(`/api/racks/${sourceRackId}`),
                        fetch(`/api/racks/${targetRackId}`),
                    ]);
                    if (srcRes.ok && tgtRes.ok) {
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
                    // Rollback fetch failed silently
                }
            }
        },
        updateRackPosition: async (rackId, posX, posY) => {
            // Optimistic update in racks array and activeRack
            set((state) => {
                const rack = state.racks.find((r) => r.id === rackId);
                if (rack) {
                    rack.posX = posX;
                    rack.posY = posY;
                }
                if (state.activeRack?.id === rackId) {
                    state.activeRack.posX = posX;
                    state.activeRack.posY = posY;
                }
            });
            try {
                await fetch(`/api/racks/${rackId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ posX, posY }),
                });
            } catch {
                // silently ignore - position will be reloaded on next fetch
            }
        },
        updateDevice: async (deviceId, updates) => {
            // Optimistic update in racks array
            set((state) => {
                for (const rack of state.racks) {
                    const device = rack.devices.find((d) => d.id === deviceId);
                    if (device) {
                        Object.assign(device, updates);
                        break;
                    }
                }
                // Also update activeRack if it contains this device
                if (state.activeRack) {
                    const device = state.activeRack.devices.find((d) => d.id === deviceId);
                    if (device) Object.assign(device, updates);
                }
            });
            const res = await fetch(`/api/devices/${deviceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (!res.ok) {
                // Rollback: refetch the affected rack
                const rack = get().racks.find((r) => r.devices.some((d) => d.id === deviceId));
                if (rack) {
                    try {
                        const rackRes = await fetch(`/api/racks/${rack.id}`);
                        if (rackRes.ok) {
                            const rackData = await rackRes.json();
                            set((state) => {
                                const idx = state.racks.findIndex((r) => r.id === rack.id);
                                if (idx !== -1) state.racks[idx] = rackData.data;
                                if (state.activeRack?.id === rack.id) state.activeRack = rackData.data;
                            });
                        }
                    } catch {
                        // Rollback fetch failed silently
                    }
                }
                throw new Error("Failed to update device");
            }
        },
        setLoading: (loading) => set((state) => { state.isLoading = loading; }),
    })),
);
