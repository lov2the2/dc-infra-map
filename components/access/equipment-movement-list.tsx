"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MovementStatusBadge } from "./movement-status-badge";
import { formatDate } from "@/lib/data-formatters";
import type { EquipmentMovementWithRelations } from "@/types/entities";

interface EquipmentMovementListProps {
    movements: EquipmentMovementWithRelations[];
}

export function EquipmentMovementList({ movements }: EquipmentMovementListProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Serial / Asset</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Rack</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {movements.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                            No equipment movements found
                        </TableCell>
                    </TableRow>
                ) : (
                    movements.map((m) => (
                        <TableRow key={m.id}>
                            <TableCell className="capitalize">{m.movementType}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{m.description ?? "-"}</TableCell>
                            <TableCell>{m.serialNumber ?? m.assetTag ?? "-"}</TableCell>
                            <TableCell>{m.site?.name ?? "-"}</TableCell>
                            <TableCell>{m.rack?.name ?? "-"}</TableCell>
                            <TableCell>
                                <MovementStatusBadge status={m.status} />
                            </TableCell>
                            <TableCell>{m.requestedByUser?.name ?? m.requestedByUser?.email ?? "-"}</TableCell>
                            <TableCell>
                                {formatDate(m.createdAt)}
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/access/equipment/${m.id}`}>View</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
