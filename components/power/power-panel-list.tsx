"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { PowerPanelWithFeeds } from "@/types/entities";

interface PowerPanelListProps {
    panels: PowerPanelWithFeeds[];
}

export function PowerPanelList({ panels }: PowerPanelListProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity (kW)</TableHead>
                    <TableHead>Voltage</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Feeds</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {panels.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No power panels found
                        </TableCell>
                    </TableRow>
                ) : (
                    panels.map((panel) => (
                        <TableRow key={panel.id}>
                            <TableCell className="font-medium">{panel.name}</TableCell>
                            <TableCell>{panel.site?.name ?? "-"}</TableCell>
                            <TableCell>{panel.location ?? "-"}</TableCell>
                            <TableCell>{panel.ratedCapacityKw}</TableCell>
                            <TableCell>{panel.voltageV}V</TableCell>
                            <TableCell className="capitalize">{panel.phaseType}</TableCell>
                            <TableCell>{panel.powerFeeds?.length ?? 0}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/power/panels/${panel.id}`}>View</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
