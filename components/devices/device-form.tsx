"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deviceCreateSchema, type DeviceCreateInput } from "@/lib/validators/device";
import type { Manufacturer, Site, Tenant } from "@/types/entities";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { QuickCreateDialog } from "@/components/devices/quick-create-dialog";
import { useCascadingSelect } from "@/hooks/use-cascading-select";
import { Plus, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { DeviceType, Location, Rack } from "@/types/entities";

interface DeviceFormProps {
    device?: {
        id: string;
        name: string;
        deviceTypeId: string;
        rackId: string | null;
        tenantId: string | null;
        status: string;
        face: string;
        position: number | null;
        serialNumber: string | null;
        assetTag: string | null;
        primaryIp: string | null;
        description: string | null;
    };
    defaultManufacturerId?: string;
}

const DEVICE_STATUSES = [
    "active", "planned", "staged", "failed", "decommissioning", "decommissioned",
];

const DEVICE_FACE_OPTIONS = [
    { value: "front", label: "Front" },
    { value: "rear", label: "Rear" },
];

function generateSlug(value: string): string {
    return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function DeviceForm({ device, defaultManufacturerId }: DeviceFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Static lists loaded once
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);

    // Cascading parent selections
    const [selectedManufacturerId, setSelectedManufacturerId] = useState(defaultManufacturerId ?? "");
    const [selectedSiteId, setSelectedSiteId] = useState("");
    const [selectedLocationId, setSelectedLocationId] = useState("");

    // Quick-create dialog state
    const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
    const [siteDialogOpen, setSiteDialogOpen] = useState(false);
    const [rackDialogOpen, setRackDialogOpen] = useState(false);

    // Quick-create form state - Tenant
    const [newTenantName, setNewTenantName] = useState("");
    const [newTenantSlug, setNewTenantSlug] = useState("");
    const [tenantCreateError, setTenantCreateError] = useState("");

    // Quick-create form state - Site
    const [newSiteName, setNewSiteName] = useState("");
    const [newSiteSlug, setNewSiteSlug] = useState("");
    const [siteCreateError, setSiteCreateError] = useState("");

    // Quick-create form state - Rack
    const [newRackName, setNewRackName] = useState("");
    const [newRackHeight, setNewRackHeight] = useState(42);
    const [rackCreateError, setRackCreateError] = useState("");

    const form = useForm<DeviceCreateInput>({
        resolver: zodResolver(deviceCreateSchema),
        defaultValues: {
            name: device?.name ?? "",
            deviceTypeId: device?.deviceTypeId ?? "",
            rackId: device?.rackId ?? null,
            tenantId: device?.tenantId ?? null,
            status: (device?.status as DeviceCreateInput["status"]) ?? "active",
            face: (device?.face as DeviceCreateInput["face"]) ?? "front",
            position: device?.position ?? null,
            serialNumber: device?.serialNumber ?? null,
            assetTag: device?.assetTag ?? null,
            primaryIp: device?.primaryIp ?? null,
            description: device?.description ?? null,
            reason: "",
        },
    });

    // Load initial data (manufacturers, sites, tenants)
    useEffect(() => {
        Promise.all([
            fetch("/api/manufacturers").then((r) => r.json()),
            fetch("/api/sites").then((r) => r.json()),
            fetch("/api/tenants").then((r) => r.json()),
        ]).then(([mfr, sit, ten]) => {
            setManufacturers(mfr.data ?? []);
            setSites(sit.data ?? []);
            setTenants(ten.data ?? []);
        }).catch(() => {
            // Keep empty arrays on fetch failure — selects remain openable but empty
        });
    }, []);

    // Cascading: manufacturer -> device types
    const deviceTypeFetchUrl = useCallback(
        (manufacturerId: string) => `/api/device-types?manufacturerId=${manufacturerId}`,
        [],
    );
    const { items: deviceTypes } = useCascadingSelect<DeviceType>(
        selectedManufacturerId,
        deviceTypeFetchUrl,
    );

    // Cascading: site -> locations
    const locationFetchUrl = useCallback(
        (siteId: string) => `/api/locations?siteId=${siteId}`,
        [],
    );
    const { items: locations } = useCascadingSelect<Location>(
        selectedSiteId,
        locationFetchUrl,
    );

    // Cascading: location -> racks
    const rackFetchUrl = useCallback(
        (locationId: string) => `/api/racks?locationId=${locationId}`,
        [],
    );
    const { items: fetchedRacks } = useCascadingSelect<Rack>(
        selectedLocationId,
        rackFetchUrl,
    );

    // Extra racks added via quick-create within this session
    const [extraRacks, setExtraRacks] = useState<Rack[]>([]);

    // Merge fetched + quick-created racks (dedup by id)
    const racks = useMemo(() => {
        const ids = new Set(fetchedRacks.map((r) => r.id));
        return [...fetchedRacks, ...extraRacks.filter((r) => !ids.has(r.id))];
    }, [fetchedRacks, extraRacks]);

    // When site changes, reset dependent selections
    const handleSiteChange = (siteId: string) => {
        setSelectedSiteId(siteId);
        setSelectedLocationId("");
        form.setValue("rackId", null);
    };

    // When location changes, reset rack selection
    const handleLocationChange = (locationId: string) => {
        setSelectedLocationId(locationId);
        form.setValue("rackId", null);
    };

    // Quick-create: Tenant
    const handleTenantNameChange = (value: string) => {
        setNewTenantName(value);
        setNewTenantSlug(generateSlug(value));
    };

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setTenantCreateError("");
        try {
            const res = await fetch("/api/tenants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTenantName, slug: newTenantSlug }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setTenantCreateError(data.error ?? "Failed to create tenant");
                return;
            }
            const data = await res.json();
            const created = data.data;
            setTenants((prev) => [...prev, created]);
            form.setValue("tenantId", created.id);
            setTenantDialogOpen(false);
            setNewTenantName("");
            setNewTenantSlug("");
        } catch {
            setTenantCreateError("Failed to create tenant");
        }
    };

    // Quick-create: Site
    const handleSiteNameChange = (value: string) => {
        setNewSiteName(value);
        setNewSiteSlug(generateSlug(value));
    };

    const handleCreateSite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSiteCreateError("");
        try {
            const res = await fetch("/api/sites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newSiteName, slug: newSiteSlug }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setSiteCreateError(data.error ?? "Failed to create site");
                return;
            }
            const data = await res.json();
            const created = data.data;
            setSites((prev) => [...prev, created]);
            handleSiteChange(created.id);
            setSiteDialogOpen(false);
            setNewSiteName("");
            setNewSiteSlug("");
        } catch {
            setSiteCreateError("Failed to create site");
        }
    };

    // Quick-create: Rack
    const handleCreateRack = async (e: React.FormEvent) => {
        e.preventDefault();
        setRackCreateError("");
        if (!selectedLocationId) {
            setRackCreateError("Please select a location first");
            return;
        }
        try {
            const res = await fetch("/api/racks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newRackName,
                    locationId: selectedLocationId,
                    uHeight: newRackHeight,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setRackCreateError(data.error ?? "Failed to create rack");
                return;
            }
            const data = await res.json();
            const created = data.data;
            setExtraRacks((prev) => [...prev, created]);
            form.setValue("rackId", created.id);
            setRackDialogOpen(false);
            setNewRackName("");
            setNewRackHeight(42);
        } catch {
            setRackCreateError("Failed to create rack");
        }
    };

    const onSubmit = async (data: DeviceCreateInput) => {
        setSubmitting(true);
        try {
            const url = device ? `/api/devices/${device.id}` : "/api/devices";
            const method = device ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const result = await res.json();
                router.push(`/devices/${result.data.id}`);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const deviceStatusOptions = DEVICE_STATUSES.map((s) => ({ value: s, label: s }));
    const manufacturerOptions = manufacturers.map((m) => ({ value: m.id, label: m.name }));
    const deviceTypeOptions = deviceTypes.map((dt) => ({
        value: dt.id,
        label: `${dt.model} (${dt.uHeight}U)`,
    }));
    const tenantOptions = tenants.map((t) => ({ value: t.id, label: t.name }));
    const siteOptions = sites.map((s) => ({ value: s.id, label: s.name }));
    const locationOptions = locations.map((l) => ({ value: l.id, label: l.name }));
    const rackOptions = racks.map((r) => ({ value: r.id, label: `${r.name} (${r.uHeight}U)` }));

    return (
        <>
            <Card>
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g., web-server-01" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <FormControl>
                                                <SearchableSelect
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    options={deviceStatusOptions}
                                                    placeholder="Select status"
                                                    searchPlaceholder="Search status..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Manufacturer (virtual field for cascading) */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Manufacturer <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <SearchableSelect
                                            value={selectedManufacturerId}
                                            onValueChange={(v) => {
                                                setSelectedManufacturerId(v);
                                                form.setValue("deviceTypeId", "");
                                            }}
                                            options={manufacturerOptions}
                                            placeholder="Select manufacturer"
                                            searchPlaceholder="Search manufacturer..."
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="Create new manufacturer"
                                            asChild
                                        >
                                            <a href="/manufacturers/new" target="_blank" rel="noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="deviceTypeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Device Type <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <SearchableSelect
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    options={deviceTypeOptions}
                                                    placeholder={selectedManufacturerId ? "Select type" : "Select manufacturer first"}
                                                    searchPlaceholder="Search device type..."
                                                    disabled={!selectedManufacturerId}
                                                />
                                            </FormControl>
                                            {selectedManufacturerId ? (
                                                <FormMessage />
                                            ) : (
                                                <p className="text-xs text-muted-foreground">Select a manufacturer first</p>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="tenantId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tenant</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <SearchableSelect
                                                        value={field.value ?? ""}
                                                        onValueChange={(v) => field.onChange(v || null)}
                                                        options={tenantOptions}
                                                        placeholder="None"
                                                        searchPlaceholder="Search tenant..."
                                                        className="flex-1"
                                                    />
                                                </FormControl>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Create new tenant"
                                                    onClick={() => setTenantDialogOpen(true)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="face"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Face</FormLabel>
                                            <FormControl>
                                                <SearchableSelect
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    options={DEVICE_FACE_OPTIONS}
                                                    placeholder="Select face"
                                                    searchPlaceholder="Search..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Location cascade: Site -> Location -> Rack */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Site</Label>
                                    <div className="flex gap-2">
                                        <SearchableSelect
                                            value={selectedSiteId}
                                            onValueChange={handleSiteChange}
                                            options={siteOptions}
                                            placeholder="Select site"
                                            searchPlaceholder="Search site..."
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="Create new site"
                                            onClick={() => setSiteDialogOpen(true)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Location</Label>
                                    <SearchableSelect
                                        value={selectedLocationId}
                                        onValueChange={handleLocationChange}
                                        options={locationOptions}
                                        placeholder="Select location"
                                        searchPlaceholder="Search location..."
                                        disabled={!selectedSiteId}
                                    />
                                    {!selectedSiteId && (
                                        <p className="text-xs text-muted-foreground">Select a site first</p>
                                    )}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="rackId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rack</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <SearchableSelect
                                                        value={field.value ?? ""}
                                                        onValueChange={(v) => field.onChange(v || null)}
                                                        options={rackOptions}
                                                        placeholder="Select rack"
                                                        searchPlaceholder="Search rack..."
                                                        disabled={!selectedLocationId}
                                                        className="flex-1"
                                                    />
                                                </FormControl>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Create new rack"
                                                    disabled={!selectedLocationId}
                                                    onClick={() => setRackDialogOpen(true)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="position"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Position (U)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    placeholder="e.g., 1"
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ? Number(e.target.value) : null,
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="serialNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Serial Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value || null)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="assetTag"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Asset Tag</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value || null)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="primaryIp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Primary IP</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value || null)
                                                }
                                                placeholder="e.g., 192.168.1.1"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value || null)
                                                }
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Change Reason</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ""}
                                                rows={2}
                                                placeholder="Reason for this change (for audit trail)"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-3">
                                <Button type="submit" disabled={submitting}>
                                    {submitting
                                        ? "Saving..."
                                        : device
                                          ? "Update Device"
                                          : "Create Device"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Quick-Create: Tenant */}
            <QuickCreateDialog
                open={tenantDialogOpen}
                onOpenChange={setTenantDialogOpen}
                title="Create Tenant"
            >
                <form onSubmit={handleCreateTenant} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-tenant-name">Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="new-tenant-name"
                            value={newTenantName}
                            onChange={(e) => handleTenantNameChange(e.target.value)}
                            placeholder="Acme Corporation"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-tenant-slug">Slug <span className="text-destructive">*</span></Label>
                        <Input
                            id="new-tenant-slug"
                            value={newTenantSlug}
                            onChange={(e) => setNewTenantSlug(e.target.value)}
                            placeholder="acme-corporation"
                            required
                        />
                    </div>
                    {tenantCreateError && (
                        <p className="text-sm text-destructive">{tenantCreateError}</p>
                    )}
                    <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={() => setTenantDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Tenant</Button>
                    </div>
                </form>
            </QuickCreateDialog>

            {/* Quick-Create: Site */}
            <QuickCreateDialog
                open={siteDialogOpen}
                onOpenChange={setSiteDialogOpen}
                title="Create Site"
            >
                <form onSubmit={handleCreateSite} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-site-name">Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="new-site-name"
                            value={newSiteName}
                            onChange={(e) => handleSiteNameChange(e.target.value)}
                            placeholder="HQ Data Center"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-site-slug">Slug <span className="text-destructive">*</span></Label>
                        <Input
                            id="new-site-slug"
                            value={newSiteSlug}
                            onChange={(e) => setNewSiteSlug(e.target.value)}
                            placeholder="hq-data-center"
                            required
                        />
                    </div>
                    {siteCreateError && (
                        <p className="text-sm text-destructive">{siteCreateError}</p>
                    )}
                    <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={() => setSiteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Site</Button>
                    </div>
                </form>
            </QuickCreateDialog>

            {/* Quick-Create: Rack */}
            <QuickCreateDialog
                open={rackDialogOpen}
                onOpenChange={setRackDialogOpen}
                title="Create Rack"
            >
                <form onSubmit={handleCreateRack} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-rack-name">Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="new-rack-name"
                            value={newRackName}
                            onChange={(e) => setNewRackName(e.target.value)}
                            placeholder="RACK-A01"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-rack-location">Location</Label>
                        <Input
                            id="new-rack-location"
                            value={locations.find((l) => l.id === selectedLocationId)?.name ?? ""}
                            disabled
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-rack-height">Height (U) <span className="text-destructive">*</span></Label>
                        <Input
                            id="new-rack-height"
                            type="number"
                            min={1}
                            max={100}
                            value={newRackHeight}
                            onChange={(e) => setNewRackHeight(parseInt(e.target.value) || 42)}
                            required
                        />
                    </div>
                    {rackCreateError && (
                        <p className="text-sm text-destructive">{rackCreateError}</p>
                    )}
                    <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={() => setRackDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Rack</Button>
                    </div>
                </form>
            </QuickCreateDialog>
        </>
    );
}
