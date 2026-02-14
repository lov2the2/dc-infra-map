import { RackCard } from "./rack-card";
import type { Rack } from "@/types/entities";
import { Server } from "lucide-react";

interface RackWithCount extends Rack {
    deviceCount: number;
}

interface FloorPlanGridProps {
    racks: RackWithCount[];
    siteId: string;
    locationId: string;
}

export function FloorPlanGrid({ racks }: FloorPlanGridProps) {
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

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {racks.map((rack) => (
                <RackCard key={rack.id} rack={rack} deviceCount={rack.deviceCount} />
            ))}
        </div>
    );
}
