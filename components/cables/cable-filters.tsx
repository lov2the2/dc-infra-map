"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { CABLE_TYPES, CABLE_STATUSES } from "@/types/cable";
import { useSearchParamsFilter } from "@/hooks/use-search-params-filter";

export function CableFilters() {
    const { updateFilter, clearFilters, getFilter } = useSearchParamsFilter("/cables");

    const hasFilters =
        getFilter("search") ||
        getFilter("cableType") ||
        getFilter("status");

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Input
                placeholder="Search cables..."
                defaultValue={getFilter("search") ?? ""}
                onChange={(e) => updateFilter("search", e.target.value || null)}
                className="w-64"
            />
            <Select
                value={getFilter("cableType") ?? ""}
                onValueChange={(v) => updateFilter("cableType", v || null)}
            >
                <SelectTrigger className="w-44">
                    <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                    {CABLE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                            {t}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={getFilter("status") ?? ""}
                onValueChange={(v) => updateFilter("status", v || null)}
            >
                <SelectTrigger className="w-44">
                    <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                    {CABLE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                            {s}
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
