"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Building2,
    LayoutGrid,
    Loader2,
    MapPin,
    Search,
    Server,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { StatusBadge } from "@/components/common/status-badge";

interface SearchResult {
    sites: { id: string; name: string }[];
    racks: { id: string; name: string }[];
    devices: { id: string; name: string; status: string }[];
    tenants: { id: string; name: string }[];
    locations: { id: string; name: string }[];
}

export function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<SearchResult | null>(null);

    // Derive loading state: dialog is open but data hasn't arrived yet
    const isLoading = open && results === null;

    // Listen for Cmd+K / Ctrl+K
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Fetch data when dialog opens
    useEffect(() => {
        if (!open) return;
        if (results !== null) return; // Already fetched or fetching

        Promise.all([
            fetch("/api/sites").then((r) => r.json()),
            fetch("/api/racks").then((r) => r.json()),
            fetch("/api/devices").then((r) => r.json()),
            fetch("/api/tenants").then((r) => r.json()),
            fetch("/api/locations").then((r) => r.json()),
        ])
            .then(([sites, racks, devices, tenants, locations]) => {
                setResults({ sites, racks, devices, tenants, locations });
            })
            .catch(() => {
                // Silently handle fetch errors; show empty results
                setResults({
                    sites: [],
                    racks: [],
                    devices: [],
                    tenants: [],
                    locations: [],
                });
            });
    }, [open, results]);

    // Reset cached results when dialog closes so next open fetches fresh data
    const handleOpenChange = useCallback((value: boolean) => {
        setOpen(value);
        if (!value) {
            setResults(null);
        }
    }, []);

    function handleSelect(path: string) {
        setOpen(false);
        router.push(path);
    }

    const hasResults =
        results &&
        (results.sites.length > 0 ||
            results.racks.length > 0 ||
            results.devices.length > 0 ||
            results.tenants.length > 0 ||
            results.locations.length > 0);

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="relative h-8 w-full justify-start rounded-md text-sm text-muted-foreground sm:w-56 md:w-64"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline-flex">Search...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">&#8984;</span>K
                </kbd>
            </Button>

            <CommandDialog
                open={open}
                onOpenChange={handleOpenChange}
                title="Search"
                description="Search for sites, racks, devices, tenants, and locations"
            >
                <CommandInput placeholder="Type to search..." />
                <CommandList>
                    {isLoading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">
                                Loading...
                            </span>
                        </div>
                    )}
                    {!isLoading && <CommandEmpty>No results found.</CommandEmpty>}
                    {!isLoading && hasResults && (
                        <>
                            {results.sites.length > 0 && (
                                <CommandGroup heading="Sites">
                                    {results.sites.map((site) => (
                                        <CommandItem
                                            key={`site-${site.id}`}
                                            onSelect={() =>
                                                handleSelect("/sites")
                                            }
                                        >
                                            <Building2 className="mr-2 h-4 w-4" />
                                            {site.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {results.racks.length > 0 && (
                                <CommandGroup heading="Racks">
                                    {results.racks.map((rack) => (
                                        <CommandItem
                                            key={`rack-${rack.id}`}
                                            onSelect={() =>
                                                handleSelect("/sites")
                                            }
                                        >
                                            <LayoutGrid className="mr-2 h-4 w-4" />
                                            {rack.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {results.devices.length > 0 && (
                                <CommandGroup heading="Devices">
                                    {results.devices.map((device) => (
                                        <CommandItem
                                            key={`device-${device.id}`}
                                            onSelect={() =>
                                                handleSelect("/devices")
                                            }
                                        >
                                            <Server className="mr-2 h-4 w-4" />
                                            <span className="flex-1">
                                                {device.name}
                                            </span>
                                            <StatusBadge
                                                status={device.status}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {results.tenants.length > 0 && (
                                <CommandGroup heading="Tenants">
                                    {results.tenants.map((tenant) => (
                                        <CommandItem
                                            key={`tenant-${tenant.id}`}
                                            onSelect={() =>
                                                handleSelect("/tenants")
                                            }
                                        >
                                            <Users className="mr-2 h-4 w-4" />
                                            {tenant.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {results.locations.length > 0 && (
                                <CommandGroup heading="Locations">
                                    {results.locations.map((location) => (
                                        <CommandItem
                                            key={`location-${location.id}`}
                                            onSelect={() =>
                                                handleSelect("/sites")
                                            }
                                        >
                                            <MapPin className="mr-2 h-4 w-4" />
                                            {location.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
