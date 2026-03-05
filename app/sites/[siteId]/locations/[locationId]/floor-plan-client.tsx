'use client'

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Map, Grid3x3 } from "lucide-react";
import { FloorPlanGrid } from "@/components/floor-plan/floor-plan-grid";
import { FloorPlanCanvas } from "@/components/floor-plan/floor-plan-canvas";
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
    gridCols,
    gridRows,
    floorCells,
}: FloorPlanClientProps) {
    const [rackPositions, setRackPositions] = useState<RackWithCount[]>(racks);

    const handlePositionChange = async (rackId: string, posX: number, posY: number) => {
        // Capture original for revert on failure
        const original = rackPositions.find((r) => r.id === rackId);
        const origPosX = original?.posX ?? null;
        const origPosY = original?.posY ?? null;

        // Optimistic update: immediately sync all three views
        setRackPositions((prev) =>
            prev.map((r) => (r.id === rackId ? { ...r, posX, posY } : r)),
        );

        try {
            const res = await fetch(`/api/racks/${rackId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ posX, posY }),
            });
            if (!res.ok) {
                // Revert on server failure
                setRackPositions((prev) =>
                    prev.map((r) =>
                        r.id === rackId ? { ...r, posX: origPosX, posY: origPosY } : r,
                    ),
                );
            }
        } catch {
            // Revert on network error
            setRackPositions((prev) =>
                prev.map((r) =>
                    r.id === rackId ? { ...r, posX: origPosX, posY: origPosY } : r,
                ),
            );
        }
    };

    return (
        <Tabs defaultValue="grid">
            <TabsList>
                <TabsTrigger value="grid" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Grid View
                </TabsTrigger>
                <TabsTrigger value="2d" className="gap-2">
                    <Map className="h-4 w-4" />
                    2D Map
                </TabsTrigger>
                <TabsTrigger value="floor-spaces" className="gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Floor Spaces
                </TabsTrigger>
            </TabsList>
            {/* forceMount keeps components mounted when switching tabs,
                preserving local state (e.g. dragOverrides in FloorPlanCanvas). */}
            <TabsContent value="grid" className="mt-4" forceMount>
                <FloorPlanGrid
                    racks={rackPositions}
                    siteId={siteId}
                    locationId={locationId}
                />
            </TabsContent>
            <TabsContent value="2d" className="mt-4" forceMount>
                <FloorPlanCanvas
                    racks={rackPositions}
                    onPositionChange={handlePositionChange}
                    gridCols={gridCols}
                    gridRows={gridRows}
                />
            </TabsContent>
            <TabsContent value="floor-spaces" className="mt-4" forceMount>
                <FloorSpaceManager
                    locationId={locationId}
                    initialGridCols={gridCols}
                    initialGridRows={gridRows}
                    initialCells={floorCells}
                    racks={rackPositions}
                    onRackPositionUpdate={handlePositionChange}
                />
            </TabsContent>
        </Tabs>
    );
}
