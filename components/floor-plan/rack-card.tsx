import Link from "next/link";
import type { Rack } from "@/types/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface RackCardProps {
    rack: Rack;
    deviceCount: number;
}

export function RackCard({ rack, deviceCount }: RackCardProps) {
    const utilization = Math.round((deviceCount / rack.uHeight) * 100);

    return (
        <Link href={`/racks/${rack.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
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
                </CardContent>
            </Card>
        </Link>
    );
}
