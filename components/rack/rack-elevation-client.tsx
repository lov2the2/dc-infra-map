"use client";

import { useEffect } from "react";
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { useRackStore } from "@/stores/use-rack-store";
import type { RackWithDevices } from "@/types/entities";
import { RackGrid } from "./rack-grid";
import { RackHeader } from "./rack-header";
import { RackFaceToggle } from "./rack-face-toggle";

interface Props {
    initialRack: RackWithDevices;
    siteName?: string;
    locationName?: string;
    siteId?: string;
}

export function RackElevationClient({ initialRack, siteName, locationName, siteId }: Props) {
    const {
        activeRack,
        activeFace,
        setActiveRack,
        setDraggingDevice,
        setDragOverSlot,
        moveDevice,
    } = useRackStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    useEffect(() => {
        setActiveRack(initialRack);
        return () => setActiveRack(null);
    }, [initialRack, setActiveRack]);

    const rack = activeRack ?? initialRack;

    function handleDragStart(event: DragStartEvent) {
        setDraggingDevice(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setDraggingDevice(null);
        setDragOverSlot(null);

        if (!over || !rack) return;

        const deviceId = active.id as string;
        const targetPosition = over.data.current?.position as number;
        if (!targetPosition) return;

        // Find the device being dragged
        const device = rack.devices.find((d) => d.id === deviceId);
        if (!device) return;

        const uHeight = device.deviceType.uHeight;

        // Check bounds
        if (targetPosition < 1 || targetPosition + uHeight - 1 > rack.uHeight) return;

        // Check if all required slots are available
        for (let u = targetPosition; u < targetPosition + uHeight; u++) {
            const occupying = rack.devices.find(
                (d) =>
                    d.id !== deviceId &&
                    d.position !== null &&
                    d.face === activeFace &&
                    u >= d.position! &&
                    u < d.position! + d.deviceType.uHeight,
            );
            if (occupying) return;
        }

        moveDevice(deviceId, targetPosition);
    }

    return (
        <div className="space-y-6">
            <RackHeader
                rack={rack}
                siteName={siteName}
                locationName={locationName}
                siteId={siteId}
            />
            <RackFaceToggle />
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <RackGrid />
            </DndContext>
        </div>
    );
}
