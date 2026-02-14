"use client";

import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import type { DeviceWithRelations } from "@/types/entities";

interface DeviceTableProps {
    devices: DeviceWithRelations[];
}

export function DeviceTable({ devices }: DeviceTableProps) {
    const router = useRouter();

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Rack</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {devices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No devices found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        devices.map((device) => (
                            <TableRow
                                key={device.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => router.push(`/devices/${device.id}`)}
                            >
                                <TableCell className="font-medium">{device.name}</TableCell>
                                <TableCell>
                                    <span className="text-muted-foreground">
                                        {device.deviceType.manufacturer?.name ?? ""}{" "}
                                    </span>
                                    {device.deviceType.model}
                                </TableCell>
                                <TableCell>{device.rack?.name ?? "—"}</TableCell>
                                <TableCell>
                                    {device.position ? `U${device.position}` : "—"}
                                </TableCell>
                                <TableCell>{device.tenant?.name ?? "—"}</TableCell>
                                <TableCell>
                                    <StatusBadge status={device.status} />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
