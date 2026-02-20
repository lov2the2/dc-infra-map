"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Tenant } from "@/types/entities";
import { useSearchParamsFilter } from "@/hooks/use-search-params-filter";

const DEVICE_STATUSES = [
    "active",
    "planned",
    "staged",
    "failed",
    "decommissioning",
    "decommissioned",
];

export function DeviceFilters() {
    const { updateFilter, clearFilters, getFilter } = useSearchParamsFilter("/devices");
    const [tenants, setTenants] = useState<Tenant[]>([]);

    useEffect(() => {
        fetch("/api/tenants")
            .then((res) => res.json())
            .then((data) => setTenants(data.data ?? []));
    }, []);

    const hasFilters =
        getFilter("search") ||
        getFilter("status") ||
        getFilter("tenantId");

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Input
                placeholder="Search devices..."
                defaultValue={getFilter("search") ?? ""}
                onChange={(e) => updateFilter("search", e.target.value || null)}
                className="w-64"
            />
            <Select
                value={getFilter("status") ?? ""}
                onValueChange={(v) => updateFilter("status", v || null)}
            >
                <SelectTrigger className="w-44">
                    <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                    {DEVICE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                            {s}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={getFilter("tenantId") ?? ""}
                onValueChange={(v) => updateFilter("tenantId", v || null)}
            >
                <SelectTrigger className="w-44">
                    <SelectValue placeholder="All tenants" />
                </SelectTrigger>
                <SelectContent>
                    {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                            {t.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-1 h-4 w-4" />
                    Clear
                </Button>
            )}
        </div>
    );
}
