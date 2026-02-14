"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Device, DeviceType } from "@/types/entities";
import { useRackStore } from "@/stores/use-rack-store";

const STATUS_BG: Record<string, string> = {
    active: "bg-emerald-500/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-200",
    planned: "bg-blue-500/20 border-blue-500/40 text-blue-900 dark:text-blue-200",
    staged: "bg-amber-500/20 border-amber-500/40 text-amber-900 dark:text-amber-200",
    failed: "bg-red-500/20 border-red-500/40 text-red-900 dark:text-red-200",
    decommissioning: "bg-orange-500/20 border-orange-500/40 text-orange-900 dark:text-orange-200",
    decommissioned: "bg-gray-500/20 border-gray-500/40 text-gray-900 dark:text-gray-200",
};

interface DeviceBlockProps {
    device: Device & { deviceType: DeviceType };
    startRow: number;
    uHeight: number;
}

export function DeviceBlock({ device, startRow, uHeight }: DeviceBlockProps) {
    const { draggingDeviceId } = useRackStore();
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: device.id,
        data: { device },
    });

    const isDragging = draggingDeviceId === device.id;
    const bgClass = STATUS_BG[device.status] ?? STATUS_BG.active;

    const style: React.CSSProperties = {
        gridRow: `${startRow} / span ${uHeight}`,
        gridColumn: 2,
        ...(transform
            ? {
                  transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
                  zIndex: 10,
              }
            : {}),
    };

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`
                flex items-center justify-between px-2 border rounded-sm mx-0.5 cursor-grab
                text-xs font-medium select-none transition-shadow
                ${bgClass}
                ${isDragging ? "opacity-50 shadow-lg" : "hover:shadow-md"}
            `}
            style={style}
        >
            <span className="truncate">{device.name}</span>
            <span className="text-[10px] opacity-70 shrink-0 ml-1">
                {device.deviceType.model}
            </span>
        </div>
    );
}
