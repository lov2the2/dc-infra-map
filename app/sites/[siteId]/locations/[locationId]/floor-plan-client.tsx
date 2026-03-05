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
    const [selectedRackId, setSelectedRackId] = useState<string | null>(null);

    const handlePositionChange = async (rackId: string, posX: number, posY: number) => {
        // Optimistic update: reflect new position immediately in Grid View and 2D Map
        setRackPositions((prev) =>
            prev.map((r) => (r.id === rackId ? { ...r, posX, posY } : r)),
        );
        try {
            // Dedicated position route uses Drizzle ORM — works without Go Core API
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
            <TabsContent value="grid" className="mt-4">
                <FloorPlanGrid
                    racks={rackPositions}
                    siteId={siteId}
                    locationId={locationId}
                    selectedRackId={selectedRackId}
                    onSelectRack={setSelectedRackId}
                />
            </TabsContent>
            <TabsContent value="2d" className="mt-4">
                <FloorPlanCanvas
                    racks={rackPositions}
                    onPositionChange={handlePositionChange}
                    selectedRackId={selectedRackId}
                    onRackSelect={setSelectedRackId}
                />
            </TabsContent>
            <TabsContent value="floor-spaces" className="mt-4">
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
