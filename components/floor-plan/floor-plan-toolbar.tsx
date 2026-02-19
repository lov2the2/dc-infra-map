'use client'

import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Grid3x3, RotateCcw } from "lucide-react";

interface FloorPlanToolbarProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onToggleGrid: () => void;
    onReset: () => void;
    showGrid: boolean;
}

export function FloorPlanToolbar({
    onZoomIn,
    onZoomOut,
    onToggleGrid,
    onReset,
    showGrid,
}: FloorPlanToolbarProps) {
    return (
        <div className="flex items-center gap-2 p-2 border rounded-lg bg-background">
            <Button
                variant="outline"
                size="icon"
                onClick={onZoomIn}
                title="Zoom In"
            >
                <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={onZoomOut}
                title="Zoom Out"
            >
                <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={onToggleGrid}
                title="Toggle Grid"
                className={showGrid ? "bg-accent" : ""}
            >
                <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={onReset}
                title="Reset View"
            >
                <RotateCcw className="h-4 w-4" />
            </Button>
        </div>
    );
}
