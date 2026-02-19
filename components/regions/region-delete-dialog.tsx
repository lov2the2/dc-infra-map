"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import type { Region } from "@/types/entities";

interface RegionDeleteDialogProps {
    region: Region | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function RegionDeleteDialog({ region, open, onOpenChange, onSuccess }: RegionDeleteDialogProps) {
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        if (!region) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/regions/${region.id}`, { method: "DELETE" });
            if (response.ok) {
                onOpenChange(false);
                onSuccess();
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Delete Region"
            description={`Are you sure you want to delete "${region?.name}"? This action cannot be undone.`}
            onConfirm={handleDelete}
            loading={loading}
        />
    );
}
