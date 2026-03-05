'use client'

import { useState, useEffect, useRef, useCallback } from "react";
import { RackCard } from "./rack-card";
import type { Rack } from "@/types/entities";
import { Server, AlignJustify, AlignVerticalJustifyStart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LS_COLUMNS = "dcim:floor-plan:grid-columns";
const LS_SETTINGS_POS = "dcim:floor-plan:settings-pos";
const CARD_WIDTH = 200;
const CARD_GAP = 12;
const DEFAULT_COLUMNS = 4;

interface RackWithCount extends Rack {
    deviceCount: number;
    usedU: number;
}

interface FloorPlanGridProps {
    racks: RackWithCount[];
    siteId: string;
    locationId: string;
    selectedRackId?: string | null;
    onSelectRack?: (rackId: string | null) => void;
}

export function FloorPlanGrid({
    racks,
    selectedRackId,
    onSelectRack,
}: FloorPlanGridProps) {
    // Always start with server-safe defaults to avoid hydration mismatches.
    // localStorage values are applied after mount via useEffect.
    const [columns, setColumns] = useState<number>(DEFAULT_COLUMNS);
    const [settingsPos, setSettingsPos] = useState<"top" | "bottom">("top");
    const [mounted, setMounted] = useState(false);
    const selectedRef = useRef<HTMLDivElement>(null);

    // Sync from localStorage after hydration
    useEffect(() => {
        const savedCols = localStorage.getItem(LS_COLUMNS);
        const parsed = parseInt(savedCols ?? "", 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 20) setColumns(parsed);

        const savedPos = localStorage.getItem(LS_SETTINGS_POS);
        if (savedPos === "top" || savedPos === "bottom") setSettingsPos(savedPos);

        setMounted(true);
    }, []);

    // Scroll selected card into view when selection changes
    useEffect(() => {
        if (!selectedRackId || !selectedRef.current) return;
        requestAnimationFrame(() => {
            selectedRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
    }, [selectedRackId]);

    const handleColumnsChange = useCallback((value: number) => {
        const clamped = Math.max(1, Math.min(20, value));
        setColumns(clamped);
        localStorage.setItem(LS_COLUMNS, String(clamped));
    }, []);

    const toggleSettingsPos = useCallback(() => {
        setSettingsPos((prev) => {
            const next = prev === "top" ? "bottom" : "top";
            localStorage.setItem(LS_SETTINGS_POS, next);
            return next;
        });
    }, []);

    // Sort racks by 2D map position (posY asc → posX asc for placed racks; unplaced last)
    const sortedRacks = [...racks].sort((a, b) => {
        const aPlaced = a.posX !== null && a.posY !== null;
        const bPlaced = b.posX !== null && b.posY !== null;
        if (aPlaced && bPlaced) {
            if (a.posY !== b.posY) return (a.posY ?? 0) - (b.posY ?? 0);
            return (a.posX ?? 0) - (b.posX ?? 0);
        }
        if (aPlaced) return -1;
        if (bPlaced) return 1;
        return 0;
    });

    if (racks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Server className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No racks found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    This location has no racks yet.
                </p>
            </div>
        );
    }

    const effectiveColumns = mounted ? columns : DEFAULT_COLUMNS;

    const settingsBar = (
        <div className="flex items-center gap-4 py-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
                {racks.length} rack{racks.length !== 1 ? "s" : ""} total
            </span>
            <div className="flex items-center gap-2">
                <Label htmlFor="grid-columns" className="text-xs whitespace-nowrap">
                    Columns
                </Label>
                <Input
                    id="grid-columns"
                    type="number"
                    min={1}
                    max={20}
                    value={effectiveColumns}
                    suppressHydrationWarning
                    onChange={(e) => handleColumnsChange(parseInt(e.target.value, 10))}
                    className="h-7 w-16 text-xs"
                />
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={toggleSettingsPos}
                title={settingsPos === "top" ? "Move settings to bottom" : "Move settings to top"}
            >
                {settingsPos === "top" ? (
                    <>
                        <AlignVerticalJustifyStart className="h-3 w-3" />
                        Move to bottom
                    </>
                ) : (
                    <>
                        <AlignJustify className="h-3 w-3" />
                        Move to top
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <div className="space-y-2">
            {settingsPos === "top" && settingsBar}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${effectiveColumns}, ${CARD_WIDTH}px)`,
                    gap: CARD_GAP,
                }}
            >
                {sortedRacks.map((rack) => (
                    <div
                        key={rack.id}
                        ref={selectedRackId === rack.id ? selectedRef : undefined}
                    >
                        <RackCard
                            rack={rack}
                            deviceCount={rack.deviceCount}
                            usedU={rack.usedU}
                            isSelected={selectedRackId === rack.id}
                            onSelect={() => onSelectRack?.(rack.id)}
                        />
                    </div>
                ))}
            </div>

            {settingsPos === "bottom" && settingsBar}
        </div>
    );
}
