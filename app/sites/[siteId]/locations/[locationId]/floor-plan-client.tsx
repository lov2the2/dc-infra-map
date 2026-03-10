'use client'

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Grid3x3 } from "lucide-react";
import { FloorPlanGrid } from "@/components/floor-plan/floor-plan-grid";
import { FloorSpaceManager } from "@/components/floor-plan/floor-space-manager";
import type { Rack, LocationFloorCell } from "@/types/entities";

interface RackWithCount extends Rack {
    deviceCount: number;
    usedU: number;
}

interface FloorPlanClientProps {
    racks: RackWithCount[];
    siteId: string;
    locationId: string;
    gridCols: number;
    gridRows: number;
    floorCells: LocationFloorCell[];
}

export function FloorPlanClient({
    racks,
    siteId,
    locationId,
    gridCols: initialGridCols,
    gridRows: initialGridRows,
    floorCells: initialFloorCells,
}: FloorPlanClientProps) {
    const [rackPositions, setRackPositions] = useState<RackWithCount[]>(racks);
    const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
    const [floorCells, setFloorCells] = useState<LocationFloorCell[]>(initialFloorCells);
    const [gridCols, setGridCols] = useState(initialGridCols);
    const [gridRows, setGridRows] = useState(initialGridRows);

    const handlePositionChange = async (rackId: string, posX: number, posY: number) => {
        // Optimistic update: reflect new position immediately in all views
        setRackPositions((prev) =>
            prev.map((r) => (r.id === rackId ? { ...r, posX, posY } : r)),
        );
        try {
            const res = await fetch(`/api/racks/${rackId}/position`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ posX, posY }),
            });
            if (!res.ok) {
                console.error("Failed to save rack position:", await res.text());
            }
        } catch (err) {
            console.error("Network error saving rack position:", err);
        }
    };

    const handlePositionSwap = async (rackAId: string, rackBId: string) => {
        const rackA = rackPositions.find((r) => r.id === rackAId);
        const rackB = rackPositions.find((r) => r.id === rackBId);
        if (!rackA || !rackB) return;

        const aPosX = rackA.posX;
        const aPosY = rackA.posY;
        const bPosX = rackB.posX;
        const bPosY = rackB.posY;

        // Optimistic update: swap positions in state immediately
        setRackPositions((prev) =>
            prev.map((r) => {
                if (r.id === rackAId) return { ...r, posX: bPosX, posY: bPosY };
                if (r.id === rackBId) return { ...r, posX: aPosX, posY: aPosY };
                return r;
            }),
        );

        // Persist both changes in parallel
        await Promise.all([
            bPosX !== null && bPosY !== null
                ? fetch(`/api/racks/${rackAId}/position`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ posX: bPosX, posY: bPosY }),
                  }).catch((err) => console.error("Failed to update rack A position:", err))
                : Promise.resolve(),
            aPosX !== null && aPosY !== null
                ? fetch(`/api/racks/${rackBId}/position`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ posX: aPosX, posY: aPosY }),
                  }).catch((err) => console.error("Failed to update rack B position:", err))
                : Promise.resolve(),
        ]);
    };

    const handleCellsChange = (updater: (prev: LocationFloorCell[]) => LocationFloorCell[]) => {
        setFloorCells(updater);
    };

    const handleGridSizeChange = (cols: number, rows: number) => {
        setGridCols(cols);
        setGridRows(rows);
    };

    return (
        <Tabs defaultValue="grid">
            <TabsList>
                <TabsTrigger value="grid" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Grid View
                </TabsTrigger>
                <TabsTrigger value="floor-map" className="gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Floor Map
                </TabsTrigger>
            </TabsList>
            <TabsContent value="grid" className="mt-4">
                <FloorPlanGrid
                    racks={rackPositions}
                    siteId={siteId}
                    locationId={locationId}
                    selectedRackId={selectedRackId}
                    onSelectRack={setSelectedRackId}
                    onPositionChange={handlePositionChange}
                    onPositionSwap={handlePositionSwap}
                />
            </TabsContent>
            <TabsContent value="floor-map" className="mt-4">
                <FloorSpaceManager
                    locationId={locationId}
                    gridCols={gridCols}
                    gridRows={gridRows}
                    cells={floorCells}
                    racks={rackPositions}
                    onRackPositionUpdate={handlePositionChange}
                    onCellsChange={handleCellsChange}
                    onGridSizeChange={handleGridSizeChange}
                />
            </TabsContent>
        </Tabs>
    );
}
