"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DeviceTransferDialog } from "@/components/devices/device-transfer-dialog";
import { MoreHorizontal, ArrowRightLeft } from "lucide-react";
import type { DeviceWithRelations } from "@/types/entities";

const BULK_STATUSES = ["active", "inactive", "maintenance", "decommissioned"] as const;

interface DeviceTableProps {
    devices: DeviceWithRelations[];
}

export function DeviceTable({ devices }: DeviceTableProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    // Transfer dialog state
    const [transferDevice, setTransferDevice] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const allSelected =
        devices.length > 0 && selectedIds.size === devices.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    function toggleAll() {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(devices.map((d) => d.id)));
        }
    }

    function toggleRow(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    async function handleBulkStatus(status: string) {
        setIsBulkLoading(true);
        try {
            await fetch("/api/devices/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: [...selectedIds],
                    action: "update",
                    data: { status },
                }),
            });
            setSelectedIds(new Set());
            router.refresh();
        } finally {
            setIsBulkLoading(false);
        }
    }

    async function handleBulkDelete() {
        setIsBulkLoading(true);
        try {
            await fetch("/api/devices/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: [...selectedIds],
                    action: "delete",
                }),
            });
            setSelectedIds(new Set());
            setShowDeleteConfirm(false);
            router.refresh();
        } finally {
            setIsBulkLoading(false);
        }
    }

    return (
        <div className="space-y-2">
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <span className="text-sm font-medium">
                        {selectedIds.size} selected
                    </span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isBulkLoading}
                            >
                                Change Status
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {BULK_STATUSES.map((s) => (
                                <DropdownMenuItem
                                    key={s}
                                    onClick={() => handleBulkStatus(s)}
                                >
                                    {s}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isBulkLoading}
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        Delete
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isBulkLoading}
                        onClick={() => setSelectedIds(new Set())}
                    >
                        Deselect
                    </Button>
                </div>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <Checkbox
                                    checked={
                                        allSelected
                                            ? true
                                            : someSelected
                                              ? "indeterminate"
                                              : false
                                    }
                                    onCheckedChange={toggleAll}
                                    aria-label="Select all devices"
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Rack</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]">
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {devices.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No devices found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            devices.map((device) => (
                                <TableRow
                                    key={device.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    data-state={
                                        selectedIds.has(device.id)
                                            ? "selected"
                                            : undefined
                                    }
                                >
                                    <TableCell
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Checkbox
                                            checked={selectedIds.has(device.id)}
                                            onCheckedChange={() =>
                                                toggleRow(device.id)
                                            }
                                            aria-label={`Select ${device.name}`}
                                        />
                                    </TableCell>
                                    <TableCell
                                        className="font-medium"
                                        onClick={() =>
                                            router.push(`/devices/${device.id}`)
                                        }
                                    >
                                        {device.name}
                                    </TableCell>
                                    <TableCell
                                        onClick={() =>
                                            router.push(`/devices/${device.id}`)
                                        }
                                    >
                                        <span className="text-muted-foreground">
                                            {device.deviceType.manufacturer?.name ?? ""}{" "}
                                        </span>
                                        {device.deviceType.model}
                                    </TableCell>
                                    <TableCell
                                        onClick={() =>
                                            router.push(`/devices/${device.id}`)
                                        }
                                    >
                                        {device.rack?.name ?? "\u2014"}
                                    </TableCell>
                                    <TableCell
                                        onClick={() =>
                                            router.push(`/devices/${device.id}`)
                                        }
                                    >
                                        {device.position
                                            ? `U${device.position}`
                                            : "\u2014"}
                                    </TableCell>
                                    <TableCell
                                        onClick={() =>
                                            router.push(`/devices/${device.id}`)
                                        }
                                    >
                                        {device.tenant?.name ?? "\u2014"}
                                    </TableCell>
                                    <TableCell
                                        onClick={() =>
                                            router.push(`/devices/${device.id}`)
                                        }
                                    >
                                        <StatusBadge status={device.status} />
                                    </TableCell>
                                    <TableCell
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    aria-label={`Actions for ${device.name}`}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        router.push(
                                                            `/devices/${device.id}`,
                                                        )
                                                    }
                                                >
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        router.push(
                                                            `/devices/${device.id}/edit`,
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setTransferDevice({
                                                            id: device.id,
                                                            name: device.name,
                                                        })
                                                    }
                                                >
                                                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                                                    Transfer to Site
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete Devices"
                description={`Are you sure you want to delete ${selectedIds.size} device(s)? This action cannot be undone.`}
                onConfirm={handleBulkDelete}
                loading={isBulkLoading}
            />

            {/* Site transfer dialog */}
            {transferDevice && (
                <DeviceTransferDialog
                    open={transferDevice !== null}
                    onOpenChange={(open) => {
                        if (!open) setTransferDevice(null);
                    }}
                    deviceId={transferDevice.id}
                    deviceName={transferDevice.name}
                />
            )}
        </div>
    );
}
