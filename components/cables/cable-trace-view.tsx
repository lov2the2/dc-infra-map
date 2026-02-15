"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Cable, Server, Network } from "lucide-react";
import type { TraceStep } from "@/types/cable";

interface CableTraceViewProps {
    path: TraceStep[];
    onClose: () => void;
}

function getStepIcon(type: string) {
    if (type === "interface") return <Network className="h-5 w-5" />;
    if (type === "frontPort" || type === "rearPort") return <Cable className="h-5 w-5" />;
    return <Server className="h-5 w-5" />;
}

export function CableTraceView({ path, onClose }: CableTraceViewProps) {
    if (path.length === 0) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Cable Trace</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No trace path found.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Cable Trace</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                    {path.map((step, idx) => (
                        <div key={`${step.type}-${step.id}`} className="flex items-center gap-2">
                            <div className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3 text-center min-w-[120px]">
                                {getStepIcon(step.type)}
                                <span className="text-xs font-medium">{step.deviceName}</span>
                                <span className="text-xs text-muted-foreground">{step.name}</span>
                                <span className="text-[10px] text-muted-foreground/70">{step.type}</span>
                            </div>
                            {idx < path.length - 1 && (
                                <div className="flex flex-col items-center gap-0.5">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    {step.cableLabel && (
                                        <span className="text-[10px] text-muted-foreground">{step.cableLabel}</span>
                                    )}
                                    {path[idx + 1]?.cableLabel && !step.cableLabel && (
                                        <span className="text-[10px] text-muted-foreground">{path[idx + 1].cableLabel}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
