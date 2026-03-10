"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Manufacturer, DeviceType } from "@/types/entities";

interface ManufacturerWithDeviceTypes extends Manufacturer {
    deviceTypes: DeviceType[];
}

interface ManufacturerTableProps {
    manufacturers: ManufacturerWithDeviceTypes[];
}

export function ManufacturerTable({ manufacturers }: ManufacturerTableProps) {
    const router = useRouter();
    const [deleteTarget, setDeleteTarget] = useState<ManufacturerWithDeviceTypes | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/manufacturers/${deleteTarget.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                console.error("Delete failed:", data?.error ?? "Unknown error");
            }
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
            router.refresh();
        }
    }

    const columns = [
        {
            key: "name",
            label: "Name",
        },
        {
            key: "slug",
            label: "Slug",
            render: (m: ManufacturerWithDeviceTypes) => (
                <span className="font-mono text-sm">{m.slug}</span>
            ),
        },
        {
            key: "deviceTypes",
            label: "Device Types",
            render: (m: ManufacturerWithDeviceTypes) => (
                <Badge variant="secondary">{m.deviceTypes.length}</Badge>
            ),
        },
        {
            key: "description",
            label: "Description",
            render: (m: ManufacturerWithDeviceTypes) => (
                <span className="text-muted-foreground line-clamp-1">
                    {m.description ?? "—"}
                </span>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (m: ManufacturerWithDeviceTypes) => (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/manufacturers/${m.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(m)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <DataTable
                columns={columns}
                data={manufacturers}
                onRowClick={(item) => router.push(`/manufacturers/${item.id}`)}
                emptyMessage="No manufacturers found. Create your first manufacturer."
            />
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Manufacturer"
                description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                loading={isDeleting}
            />
        </>
    );
}
