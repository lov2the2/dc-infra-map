"use client";

import { useDraggable } from "@dnd-kit/core";
import { Pencil } from "lucide-react";
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
    sourceRackId: string;
    onEditClick?: (device: Device & { deviceType: DeviceType }) => void;
}

export function DeviceBlock({ device, startRow, uHeight, sourceRackId, onEditClick }: DeviceBlockProps) {
    const { draggingDeviceId } = useRackStore();
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: device.id,
        data: { device, sourceRackId },
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
                group flex items-center justify-between px-2 border rounded-sm mx-0.5 cursor-grab
                text-xs font-medium select-none transition-shadow
                ${bgClass}
                ${isDragging ? "opacity-50 shadow-lg" : "hover:shadow-md"}
            `}
            style={style}
        >
            <span className="truncate">{device.name}</span>
            <div className="flex items-center shrink-0 ml-1 gap-1">
                <span className="text-[10px] opacity-70">
                    {device.deviceType.model}
                </span>
                {onEditClick && (
                    <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onEditClick(device);
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                        }}
                        title="편집"
                    >
                        <Pencil className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    );
}
