"use client";

import { useEffect, useState } from "react";
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { useRackStore } from "@/stores/use-rack-store";
import type { RackWithDevices, Device, DeviceType } from "@/types/entities";
import { RackGrid } from "./rack-grid";
import { RackFaceToggle } from "./rack-face-toggle";
import { DeviceEditDialog } from "./device-edit-dialog";

interface Props {
    initialRacks: RackWithDevices[];
}

export function MultiRackElevationClient({ initialRacks }: Props) {
    const {
        racks,
        activeFace,
        setRacks,
        setDraggingDevice,
        setDragOverSlot,
        moveDeviceBetweenRacks,
    } = useRackStore();

    const [editingDevice, setEditingDevice] = useState<(Device & { deviceType: DeviceType }) | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const handleDeviceClick = (device: Device & { deviceType: DeviceType }) => {
        setEditingDevice(device);
        setEditDialogOpen(true);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    useEffect(() => {
        setRacks(initialRacks);
        return () => setRacks([]);
    }, [initialRacks, setRacks]);

    const displayRacks = racks.length > 0 ? racks : initialRacks;
    const locationId = displayRacks[0]?.locationId ?? undefined;

    function handleDragStart(event: DragStartEvent) {
        setDraggingDevice(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setDraggingDevice(null);
        setDragOverSlot(null);

        if (!over) return;

        const deviceId = active.id as string;
        const sourceRackId = active.data.current?.sourceRackId as string;
        const targetRackId = over.data.current?.rackId as string;
        const targetPosition = over.data.current?.position as number;

        if (!sourceRackId || !targetRackId || !targetPosition) return;

        const sourceRack = displayRacks.find((r) => r.id === sourceRackId);
        const targetRack = displayRacks.find((r) => r.id === targetRackId);
        if (!sourceRack || !targetRack) return;

        const device = sourceRack.devices.find((d) => d.id === deviceId);
        if (!device) return;

        const uHeight = device.deviceType.uHeight;

        // Check bounds in target rack
        if (targetPosition < 1 || targetPosition + uHeight - 1 > targetRack.uHeight) return;

        // Check slot availability in target rack
        for (let u = targetPosition; u < targetPosition + uHeight; u++) {
            const occupying = targetRack.devices.find(
                (d) =>
                    d.id !== deviceId &&
                    d.position !== null &&
                    d.face === activeFace &&
                    u >= d.position! &&
                    u < d.position! + d.deviceType.uHeight,
            );
            if (occupying) return;
        }

        // Use moveDeviceBetweenRacks for both same-rack and cross-rack moves
        moveDeviceBetweenRacks(deviceId, sourceRackId, targetRackId, targetPosition);
    }

    return (
        <div className="space-y-4">
            <RackFaceToggle />
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-6">
                    {displayRacks.map((rack) => (
                        <div key={rack.id} className="flex-shrink-0 space-y-2">
                            <div className="text-sm font-semibold text-center">{rack.name}</div>
                            <RackGrid
                                rack={rack}
                                activeFace={activeFace}
                                onDeviceClick={handleDeviceClick}
                            />
                        </div>
                    ))}
                </div>
            </DndContext>
            <DeviceEditDialog
                device={editingDevice}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                locationId={locationId}
            />
        </div>
    );
}
