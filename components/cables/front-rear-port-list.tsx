"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { FrontPort, RearPort } from "@/types/cable";

interface FrontRearPortListProps {
    deviceId: string;
}

export function FrontRearPortList({ deviceId }: FrontRearPortListProps) {
    const [frontPorts, setFrontPorts] = useState<(FrontPort & { rearPort?: RearPort })[]>([]);
    const [rearPorts, setRearPorts] = useState<RearPort[]>([]);

    useEffect(() => {
        Promise.all([
            fetch(`/api/front-ports?deviceId=${deviceId}`).then((r) => r.json()),
            fetch(`/api/rear-ports?deviceId=${deviceId}`).then((r) => r.json()),
        ]).then(([fp, rp]) => {
            setFrontPorts(fp.data ?? []);
            setRearPorts(rp.data ?? []);
        });
    }, [deviceId]);

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Front Ports</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Port Type</TableHead>
                                <TableHead>Rear Port</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {frontPorts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                                        No front ports found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                frontPorts.map((port) => (
                                    <TableRow key={port.id}>
                                        <TableCell className="font-medium">{port.name}</TableCell>
                                        <TableCell>{port.portType}</TableCell>
                                        <TableCell>{port.rearPort?.name ?? "—"}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {port.description ?? "—"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rear Ports</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Port Type</TableHead>
                                <TableHead>Positions</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rearPorts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                                        No rear ports found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rearPorts.map((port) => (
                                    <TableRow key={port.id}>
                                        <TableCell className="font-medium">{port.name}</TableCell>
                                        <TableCell>{port.portType}</TableCell>
                                        <TableCell>{port.positions}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {port.description ?? "—"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
