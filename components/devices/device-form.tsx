"use client";

import { useCallback, useEffect, useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useCascadingSelect } from "@/hooks/use-cascading-select";
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
    const { items: racks } = useCascadingSelect<Rack>(
        selectedLocationId,
        rackFetchUrl,
    );

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

    return (
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
                                        <FormLabel>Name</FormLabel>
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
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {DEVICE_STATUSES.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Manufacturer (virtual field for cascading) */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Manufacturer</label>
                                <Select
                                    value={selectedManufacturerId}
                                    onValueChange={setSelectedManufacturerId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select manufacturer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {manufacturers.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <FormField
                                control={form.control}
                                name="deviceTypeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Device Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {deviceTypes.map((dt) => (
                                                    <SelectItem key={dt.id} value={dt.id}>
                                                        {dt.model} ({dt.uHeight}U)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tenantId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tenant</FormLabel>
                                        <Select
                                            onValueChange={(v) => field.onChange(v || null)}
                                            defaultValue={field.value ?? ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="None" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {tenants.map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="front">Front</SelectItem>
                                                <SelectItem value="rear">Rear</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Location cascade: Site -> Location -> Rack */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Site</label>
                                <Select
                                    value={selectedSiteId}
                                    onValueChange={handleSiteChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select site" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sites.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location</label>
                                <Select
                                    value={selectedLocationId}
                                    onValueChange={handleLocationChange}
                                    disabled={!selectedSiteId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((l) => (
                                            <SelectItem key={l.id} value={l.id}>
                                                {l.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <FormField
                                control={form.control}
                                name="rackId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rack</FormLabel>
                                        <Select
                                            onValueChange={(v) => field.onChange(v || null)}
                                            defaultValue={field.value ?? ""}
                                            disabled={!selectedLocationId}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select rack" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {racks.map((r) => (
                                                    <SelectItem key={r.id} value={r.id}>
                                                        {r.name} ({r.uHeight}U)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
    );
}
