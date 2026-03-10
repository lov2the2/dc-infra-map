'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Rack } from "@/types/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check } from "lucide-react";

interface RackCardProps {
    rack: Rack;
    deviceCount: number;
    usedU: number;
    isSelected?: boolean;
    onSelect?: () => void;
    onPositionChange?: (rackId: string, posX: number, posY: number) => void;
}

export function RackCard({ rack, deviceCount, usedU, isSelected, onSelect, onPositionChange }: RackCardProps) {
    const utilization = Math.round((usedU / rack.uHeight) * 100);
    const posLabel =
        rack.posX !== null && rack.posY !== null
            ? `(${rack.posX}, ${rack.posY})`
            : "unplaced";

    const [editX, setEditX] = useState<string>('');
    const [editY, setEditY] = useState<string>('');

    // Reset edit fields whenever this card becomes selected or position changes.
    useEffect(() => {
        if (isSelected) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEditX(rack.posX?.toString() ?? '');
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEditY(rack.posY?.toString() ?? '');
        }
    }, [isSelected, rack.posX, rack.posY]);

    const handlePositionApply = () => {
        const x = parseInt(editX, 10);
        const y = parseInt(editY, 10);
        if (isNaN(x) || isNaN(y) || x < 0 || y < 0) return;
        onPositionChange?.(rack.id, x, y);
    };

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
                {isSelected && onPositionChange && (
                    <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1.5">Floor Position</p>
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">X</span>
                                <Input
                                    type="number"
                                    min={0}
                                    value={editX}
                                    onChange={(e) => setEditX(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handlePositionApply(); }}
                                    className="h-6 w-14 text-xs px-1.5"
                                    placeholder={rack.posX?.toString() ?? '-'}
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Y</span>
                                <Input
                                    type="number"
                                    min={0}
                                    value={editY}
                                    onChange={(e) => setEditY(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handlePositionApply(); }}
                                    className="h-6 w-14 text-xs px-1.5"
                                    placeholder={rack.posY?.toString() ?? '-'}
                                />
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); handlePositionApply(); }}
                                disabled={editX === '' || editY === ''}
                            >
                                <Check className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}
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
