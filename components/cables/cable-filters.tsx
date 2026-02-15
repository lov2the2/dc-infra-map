"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { CABLE_TYPES, CABLE_STATUSES } from "@/types/cable";

export function CableFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateFilter = useCallback(
        (key: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            router.push(`/cables?${params.toString()}`);
        },
        [router, searchParams],
    );

    const clearFilters = () => {
        router.push("/cables");
    };

    const hasFilters =
        searchParams.get("search") ||
        searchParams.get("cableType") ||
        searchParams.get("status");

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Input
                placeholder="Search cables..."
                defaultValue={searchParams.get("search") ?? ""}
                onChange={(e) => updateFilter("search", e.target.value || null)}
                className="w-64"
            />
            <Select
                value={searchParams.get("cableType") ?? ""}
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
                value={searchParams.get("status") ?? ""}
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
