"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Trash2 } from "lucide-react";
import { useDeleteMutation } from "@/hooks/use-delete-mutation";

interface TenantDeleteButtonProps {
    tenantId: string;
    tenantName: string;
}

export function TenantDeleteButton({ tenantId, tenantName }: TenantDeleteButtonProps) {
    const [open, setOpen] = useState(false);

    const { handleDelete, isLoading } = useDeleteMutation({
        endpoint: `/api/tenants/${tenantId}`,
        redirectPath: "/tenants",
        onSuccess: () => setOpen(false),
    });

    async function onConfirm() {
        await handleDelete();
        setOpen(false);
    }

    return (
        <>
            <Button variant="destructive" onClick={() => setOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="Delete Tenant"
                description={`Are you sure you want to delete "${tenantName}"? This action cannot be undone.`}
                onConfirm={onConfirm}
                loading={isLoading}
            />
        </>
    );
}
