'use client'

import Link from "next/link";
import type { Rack } from "@/types/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface RackCardProps {
    rack: Rack;
    deviceCount: number;
    usedU: number;
    isSelected?: boolean;
    onSelect?: () => void;
}

export function RackCard({ rack, deviceCount, usedU, isSelected, onSelect }: RackCardProps) {
    const utilization = Math.round((usedU / rack.uHeight) * 100);
    const posLabel =
        rack.posX !== null && rack.posY !== null
            ? `(${rack.posX}, ${rack.posY})`
            : "unplaced";

    return (
        <Card
            className={[
                "transition-shadow cursor-pointer h-full",
                isSelected
                    ? "ring-2 ring-primary shadow-md"
                    : "hover:shadow-md",
            ].join(" ")}
            onClick={() => {
                if (!isSelected && onSelect) onSelect();
            }}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-1">
                    <CardTitle className="text-sm font-semibold line-clamp-1">
                        {rack.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                        {rack.type}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rack.uHeight}U</p>
            </CardHeader>
            <CardContent className="space-y-2">
                <Progress value={utilization} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{deviceCount} devices</span>
                    <span>{utilization}%</span>
                </div>
                {/* Position coordinates for 2D Map sync verification */}
                <p className="text-[10px] text-muted-foreground">{posLabel}</p>
                {isSelected && (
                    <Button
                        asChild
                        size="sm"
                        variant="default"
                        className="w-full text-xs h-7"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Link href={`/racks/${rack.id}`}>
                            View Elevation
                            <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
