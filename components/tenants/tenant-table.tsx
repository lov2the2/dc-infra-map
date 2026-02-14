"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/common/data-table";
import type { Tenant } from "@/types/entities";

interface TenantTableProps {
    tenants: Tenant[];
}

export function TenantTable({ tenants }: TenantTableProps) {
    const router = useRouter();

    const columns = [
        {
            key: "name",
            label: "Name",
        },
        {
            key: "slug",
            label: "Slug",
            render: (tenant: Tenant) => (
                <span className="font-mono text-sm">{tenant.slug}</span>
            ),
        },
        {
            key: "description",
            label: "Description",
            render: (tenant: Tenant) => (
                <span className="text-muted-foreground">
                    {tenant.description ?? "—"}
                </span>
            ),
        },
        {
            key: "createdAt",
            label: "Created",
            render: (tenant: Tenant) => (
                <span>{new Date(tenant.createdAt).toLocaleDateString()}</span>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={tenants}
            onRowClick={(item) => {
                router.push(`/tenants/${item.id}`);
            }}
            emptyMessage="No tenants found. Create your first tenant."
        />
    );
}
