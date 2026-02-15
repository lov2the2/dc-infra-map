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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InterfaceForm } from "@/components/cables/interface-form";
import type { Interface } from "@/types/cable";

interface InterfaceListProps {
    deviceId: string;
}

export function InterfaceList({ deviceId }: InterfaceListProps) {
    const [interfaces, setInterfaces] = useState<Interface[]>([]);
    const [formOpen, setFormOpen] = useState(false);

    const fetchInterfaces = () => {
        fetch(`/api/interfaces?deviceId=${deviceId}`)
            .then((res) => res.json())
            .then((json) => setInterfaces(json.data ?? []));
    };

    useEffect(() => {
        fetchInterfaces();
    }, [deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Interfaces</h3>
                <Button size="sm" onClick={() => setFormOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Interface
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Speed</TableHead>
                            <TableHead>MAC Address</TableHead>
                            <TableHead>Enabled</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {interfaces.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                                    No interfaces found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            interfaces.map((iface) => (
                                <TableRow key={iface.id}>
                                    <TableCell className="font-medium">{iface.name}</TableCell>
                                    <TableCell>{iface.interfaceType}</TableCell>
                                    <TableCell>{iface.speed ? `${iface.speed} Mbps` : "—"}</TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {iface.macAddress ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={iface.enabled
                                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                            : "bg-gray-500/15 text-gray-700 dark:text-gray-400"
                                        }>
                                            {iface.enabled ? "enabled" : "disabled"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <InterfaceForm
                deviceId={deviceId}
                open={formOpen}
                onOpenChange={setFormOpen}
                onSuccess={fetchInterfaces}
            />
        </div>
    );
}
