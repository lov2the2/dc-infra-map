"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Site } from "@/types/entities";

interface AccessLogFiltersProps {
    sites: Site[];
}

export function AccessLogFilters({ sites }: AccessLogFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateParam = useCallback(
        (key: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value && value !== "all") {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            router.push(`?${params.toString()}`);
        },
        [router, searchParams],
    );

    const clearFilters = () => {
        router.push("?");
    };

    return (
        <div className="flex flex-wrap gap-3">
            <Select
                value={searchParams.get("siteId") ?? "all"}
                onValueChange={(v) => updateParam("siteId", v)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Sites" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                            {site.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={searchParams.get("status") ?? "all"}
                onValueChange={(v) => updateParam("status", v)}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={searchParams.get("accessType") ?? "all"}
                onValueChange={(v) => updateParam("accessType", v)}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="visit">Visit</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="tour">Tour</SelectItem>
                </SelectContent>
            </Select>

            <Input
                placeholder="Search by name..."
                className="w-[200px]"
                defaultValue={searchParams.get("personnelName") ?? ""}
                onChange={(e) => updateParam("personnelName", e.target.value || null)}
            />

            <Button variant="outline" onClick={clearFilters}>
                Clear
            </Button>
        </div>
    );
}
