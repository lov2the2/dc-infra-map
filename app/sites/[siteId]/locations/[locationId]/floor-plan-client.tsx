'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Map } from "lucide-react";
import { FloorPlanGrid } from "@/components/floor-plan/floor-plan-grid";
import { FloorPlanCanvas } from "@/components/floor-plan/floor-plan-canvas";
import type { Rack } from "@/types/entities";

interface RackWithCount extends Rack {
    deviceCount: number;
}

interface FloorPlanClientProps {
    racks: RackWithCount[];
    siteId: string;
    locationId: string;
}

export function FloorPlanClient({ racks, siteId, locationId }: FloorPlanClientProps) {
    const handlePositionChange = async (rackId: string, posX: number, posY: number) => {
        try {
            await fetch(`/api/racks/${rackId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ posX, posY }),
            });
        } catch {
            // silently ignore
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
            </TabsList>
            <TabsContent value="grid" className="mt-4">
                <FloorPlanGrid
                    racks={racks}
                    siteId={siteId}
                    locationId={locationId}
                />
            </TabsContent>
            <TabsContent value="2d" className="mt-4">
                <FloorPlanCanvas
                    racks={racks}
                    onPositionChange={handlePositionChange}
                />
            </TabsContent>
        </Tabs>
    );
}
