"use client";

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
import { useSearchParamsFilter } from "@/hooks/use-search-params-filter";

interface AccessLogFiltersProps {
    sites: Site[];
}

export function AccessLogFilters({ sites }: AccessLogFiltersProps) {
    const { updateFilter, clearFilters, getFilter } = useSearchParamsFilter("");

    // Wrap updateFilter to treat "all" as a clear signal
    const updateParam = (key: string, value: string | null) => {
        updateFilter(key, value === "all" ? null : value);
    };

    return (
        <div className="flex flex-wrap gap-3">
            <Select
                value={getFilter("siteId") ?? "all"}
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
                value={getFilter("status") ?? "all"}
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
                value={getFilter("accessType") ?? "all"}
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
                defaultValue={getFilter("personnelName") ?? ""}
                onChange={(e) => updateParam("personnelName", e.target.value || null)}
            />

            <Button variant="outline" onClick={clearFilters}>
                Clear
            </Button>
        </div>
    );
}
