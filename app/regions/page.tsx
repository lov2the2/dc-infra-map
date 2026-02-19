"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { RegionTable } from "@/components/regions/region-table";
import { RegionForm } from "@/components/regions/region-form";
import { RegionDeleteDialog } from "@/components/regions/region-delete-dialog";
import type { Region } from "@/types/entities";

export default function RegionsPage() {
    const [regions, setRegions] = useState<Region[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRegion, setEditingRegion] = useState<Region | null>(null);
    const [deletingRegion, setDeletingRegion] = useState<Region | null>(null);

    const fetchRegions = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/regions");
            if (res.ok) {
                const json = await res.json();
                setRegions(json.data ?? []);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRegions();
    }, [fetchRegions]);

    function handleEdit(region: Region) {
        setEditingRegion(region);
        setShowForm(true);
    }

    function handleDelete(region: Region) {
        setDeletingRegion(region);
    }

    function handleFormOpenChange(open: boolean) {
        setShowForm(open);
        if (!open) setEditingRegion(null);
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Regions"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Regions" },
                ]}
                action={
                    <Button onClick={() => { setEditingRegion(null); setShowForm(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Region
                    </Button>
                }
            />
            {isLoading ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
            ) : (
                <RegionTable
                    regions={regions}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
            <RegionForm
                region={editingRegion ?? undefined}
                open={showForm}
                onOpenChange={handleFormOpenChange}
                onSuccess={fetchRegions}
            />
            <RegionDeleteDialog
                region={deletingRegion}
                open={!!deletingRegion}
                onOpenChange={(open) => { if (!open) setDeletingRegion(null); }}
                onSuccess={fetchRegions}
            />
        </div>
    );
}
