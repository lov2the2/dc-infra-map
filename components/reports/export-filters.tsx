"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Site {
    id: string;
    name: string;
}

interface Tenant {
    id: string;
    name: string;
}

interface ExportFiltersProps {
    showSite?: boolean;
    showDateRange?: boolean;
    showTenant?: boolean;
    onFiltersChange: (params: string) => void;
}

export function ExportFilters({
    showSite = false,
    showDateRange = false,
    showTenant = false,
    onFiltersChange,
}: ExportFiltersProps) {
    const [sites, setSites] = useState<Site[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [siteId, setSiteId] = useState("");
    const [tenantId, setTenantId] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    useEffect(() => {
        if (showSite) {
            fetch("/api/sites")
                .then((r) => r.json())
                .then((d) => setSites(d.data ?? []))
                .catch(() => {});
        }
        if (showTenant) {
            fetch("/api/tenants")
                .then((r) => r.json())
                .then((d) => setTenants(d.data ?? []))
                .catch(() => {});
        }
    }, [showSite, showTenant]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (siteId) params.set("siteId", siteId);
        if (tenantId) params.set("tenantId", tenantId);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        onFiltersChange(params.toString());
    }, [siteId, tenantId, from, to, onFiltersChange]);

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {showSite && (
                <div className="space-y-2">
                    <Label htmlFor="site-filter">Site</Label>
                    <Select value={siteId} onValueChange={setSiteId}>
                        <SelectTrigger id="site-filter">
                            <SelectValue placeholder="All sites" />
                        </SelectTrigger>
                        <SelectContent>
                            {sites.map((site) => (
                                <SelectItem key={site.id} value={site.id}>
                                    {site.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {showTenant && (
                <div className="space-y-2">
                    <Label htmlFor="tenant-filter">Tenant</Label>
                    <Select value={tenantId} onValueChange={setTenantId}>
                        <SelectTrigger id="tenant-filter">
                            <SelectValue placeholder="All tenants" />
                        </SelectTrigger>
                        <SelectContent>
                            {tenants.map((tenant) => (
                                <SelectItem key={tenant.id} value={tenant.id}>
                                    {tenant.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {showDateRange && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="from-date">From</Label>
                        <Input
                            id="from-date"
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="to-date">To</Label>
                        <Input
                            id="to-date"
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
