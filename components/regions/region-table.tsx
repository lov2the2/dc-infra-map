"use client";

import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import type { Region } from "@/types/entities";

interface RegionTableProps {
    regions: Region[];
    onEdit: (region: Region) => void;
    onDelete: (region: Region) => void;
}

export function RegionTable({ regions, onEdit, onDelete }: RegionTableProps) {
    const columns = [
        { key: "name", label: "Name" },
        {
            key: "slug",
            label: "Slug",
            render: (region: Region) => (
                <span className="font-mono text-sm">{region.slug}</span>
            ),
        },
        {
            key: "description",
            label: "Description",
            render: (region: Region) => (
                <span className="text-muted-foreground">
                    {region.description ?? "—"}
                </span>
            ),
        },
        {
            key: "createdAt",
            label: "Created",
            render: (region: Region) => (
                <span>{new Date(region.createdAt).toLocaleDateString()}</span>
            ),
        },
        {
            key: "actions",
            label: "",
            render: (region: Region) => (
                <div className="flex gap-2 justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(region);
                        }}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(region);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={regions}
            emptyMessage="No regions found. Create your first region."
        />
    );
}
