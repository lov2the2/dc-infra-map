"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Trash2 } from "lucide-react";

interface TenantDeleteButtonProps {
    tenantId: string;
    tenantName: string;
}

export function TenantDeleteButton({ tenantId, tenantName }: TenantDeleteButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        try {
            const response = await fetch(`/api/tenants/${tenantId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                router.push("/tenants");
                router.refresh();
            }
        } finally {
            setLoading(false);
            setOpen(false);
        }
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
                onConfirm={handleDelete}
                loading={loading}
            />
        </>
    );
}
