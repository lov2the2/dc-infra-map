"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCascadingSelect } from "@/hooks/use-cascading-select";
import type { Site, Location, Rack } from "@/types/entities";

interface DeviceTransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deviceId: string;
    deviceName: string;
}

export function DeviceTransferDialog({
    open,
    onOpenChange,
    deviceId,
    deviceName,
}: DeviceTransferDialogProps) {
    const router = useRouter();
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState("");
    const [selectedLocationId, setSelectedLocationId] = useState("");
    const [selectedRackId, setSelectedRackId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load sites on open
    useEffect(() => {
        if (!open) return;
        fetch("/api/sites")
            .then((r) => r.json())
            .then((data) => setSites(data.data ?? []))
            .catch(() => setSites([]));
    }, [open]);

    // Reset selections when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedSiteId("");
            setSelectedLocationId("");
            setSelectedRackId("");
            setError(null);
        }
    }, [open]);

    // Cascading: site -> locations
    const locationFetchUrl = useCallback(
        (siteId: string) => `/api/locations?siteId=${siteId}`,
        [],
    );
    const { items: locations, isLoading: locationsLoading } =
        useCascadingSelect<Location>(selectedSiteId, locationFetchUrl);

    // Cascading: location -> racks
    const rackFetchUrl = useCallback(
        (locationId: string) => `/api/racks?locationId=${locationId}`,
        [],
    );
    const { items: racks, isLoading: racksLoading } = useCascadingSelect<Rack>(
        selectedLocationId,
        rackFetchUrl,
    );

    function handleSiteChange(siteId: string) {
        setSelectedSiteId(siteId);
        setSelectedLocationId("");
        setSelectedRackId("");
        setError(null);
    }

    function handleLocationChange(locationId: string) {
        setSelectedLocationId(locationId);
        setSelectedRackId("");
    }

    async function handleTransfer() {
        if (!selectedSiteId) {
            setError("Please select a target site.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/devices/${deviceId}/transfer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetSiteId: selectedSiteId,
                    targetRackId: selectedRackId || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Transfer failed. Please try again.");
                return;
            }

            onOpenChange(false);
            router.refresh();
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Transfer Device to Another Site</DialogTitle>
                    <DialogDescription>
                        Move <strong>{deviceName}</strong> to a different site. Select an
                        optional rack to assign the device directly.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Target Site */}
                    <div className="space-y-2">
                        <Label htmlFor="transfer-site">Target Site</Label>
                        <Select value={selectedSiteId} onValueChange={handleSiteChange}>
                            <SelectTrigger id="transfer-site">
                                <SelectValue placeholder="Select site" />
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

                    {/* Target Location (cascade) */}
                    <div className="space-y-2">
                        <Label htmlFor="transfer-location">Location (optional)</Label>
                        <Select
                            value={selectedLocationId}
                            onValueChange={handleLocationChange}
                            disabled={!selectedSiteId || locationsLoading}
                        >
                            <SelectTrigger id="transfer-location">
                                <SelectValue
                                    placeholder={
                                        locationsLoading ? "Loading..." : "Select location"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map((loc) => (
                                    <SelectItem key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Target Rack (cascade) */}
                    <div className="space-y-2">
                        <Label htmlFor="transfer-rack">Rack (optional)</Label>
                        <Select
                            value={selectedRackId}
                            onValueChange={setSelectedRackId}
                            disabled={!selectedLocationId || racksLoading}
                        >
                            <SelectTrigger id="transfer-rack">
                                <SelectValue
                                    placeholder={
                                        racksLoading ? "Loading..." : "Select rack"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {racks.map((rack) => (
                                    <SelectItem key={rack.id} value={rack.id}>
                                        {rack.name} ({rack.uHeight}U)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive" role="alert">
                            {error}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTransfer}
                        disabled={!selectedSiteId || isSubmitting}
                    >
                        {isSubmitting ? "Transferring..." : "Transfer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
