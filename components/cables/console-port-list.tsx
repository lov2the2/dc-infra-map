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
import type { ConsolePort } from "@/types/cable";

interface ConsolePortListProps {
    deviceId: string;
}

export function ConsolePortList({ deviceId }: ConsolePortListProps) {
    const [ports, setPorts] = useState<ConsolePort[]>([]);

    useEffect(() => {
        fetch(`/api/console-ports?deviceId=${deviceId}`)
            .then((res) => res.json())
            .then((json) => setPorts(json.data ?? []));
    }, [deviceId]);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Console Ports</h3>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Port Type</TableHead>
                            <TableHead>Speed</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                                    No console ports found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            ports.map((port) => (
                                <TableRow key={port.id}>
                                    <TableCell className="font-medium">{port.name}</TableCell>
                                    <TableCell>{port.portType}</TableCell>
                                    <TableCell>{port.speed ? `${port.speed} bps` : "—"}</TableCell>
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
    );
}
