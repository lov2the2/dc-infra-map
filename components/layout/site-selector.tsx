"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Building2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSiteStore } from "@/stores/use-site-store";
import type { Site } from "@/types/entities";

// Sentinel value used in <Select> to represent "All Sites" (activeSiteId = null)
const ALL_SITES_VALUE = "__all__";
const emptySubscribe = () => () => {};

export function SiteSelector() {
    const { activeSiteId, setActiveSite } = useSiteStore();
    const [sites, setSites] = useState<Site[]>([]);
    const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

    // Fetch site list on mount
    useEffect(() => {
        fetch("/api/sites")
            .then((r) => r.json())
            .then((data) => setSites(data.data ?? []))
            .catch(() => setSites([]));
    }, []);

    function handleValueChange(value: string) {
        setActiveSite(value === ALL_SITES_VALUE ? null : value);
    }

    // Convert null activeSiteId to sentinel string for <Select>
    const selectValue = hydrated
        ? (activeSiteId ?? ALL_SITES_VALUE)
        : ALL_SITES_VALUE;

    return (
        <div className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={selectValue} onValueChange={handleValueChange}>
                <SelectTrigger className="h-8 w-[160px] text-sm border-dashed">
                    <SelectValue placeholder="All Sites" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_SITES_VALUE}>All Sites</SelectItem>
                    {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                            {site.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
