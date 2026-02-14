"use client";

import { useDroppable } from "@dnd-kit/core";
import { useRackStore } from "@/stores/use-rack-store";

interface RackSlotProps {
    position: number;
    gridRow: number;
}

export function RackSlot({ position, gridRow }: RackSlotProps) {
    const { dragOverSlot } = useRackStore();
    const { setNodeRef, isOver } = useDroppable({
        id: `slot-${position}`,
        data: { position },
    });

    const isHighlighted = isOver || dragOverSlot === position;

    return (
        <div
            ref={setNodeRef}
            className={`border-b flex items-center px-2 text-[10px] text-muted-foreground/50 transition-colors ${
                isHighlighted
                    ? "bg-primary/20 border-primary/40 border-dashed"
                    : "hover:bg-muted/50"
            }`}
            style={{ gridRow, gridColumn: 2 }}
        />
    );
}
