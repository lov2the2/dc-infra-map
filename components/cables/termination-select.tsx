"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TERMINATION_TYPES } from "@/types/cable";

interface TerminationOption {
    id: string;
    name: string;
    deviceName: string;
}

interface TerminationSelectProps {
    label: string;
    typeValue: string;
    idValue: string;
    onTypeChange: (value: string) => void;
    onIdChange: (value: string) => void;
}

const TYPE_API_MAP: Record<string, string> = {
    interface: "/api/interfaces",
    frontPort: "/api/front-ports",
    rearPort: "/api/rear-ports",
    consolePort: "/api/console-ports",
};

export function TerminationSelect({
    label,
    typeValue,
    idValue,
    onTypeChange,
    onIdChange,
}: TerminationSelectProps) {
    const [fetchedOptions, setFetchedOptions] = useState<TerminationOption[]>([]);
    const [fetchedForUrl, setFetchedForUrl] = useState<string | undefined>(undefined);

    const apiUrl = TYPE_API_MAP[typeValue];

    useEffect(() => {
        if (!apiUrl) return;

        let cancelled = false;
        fetch(apiUrl)
            .then((res) => res.json())
            .then((json) => {
                if (cancelled) return;
                const data = json.data ?? [];
                setFetchedForUrl(apiUrl);
                setFetchedOptions(
                    data.map((item: { id: string; name: string; device?: { name: string } }) => ({
                        id: item.id,
                        name: item.name,
                        deviceName: item.device?.name ?? "—",
                    })),
                );
            });

        return () => { cancelled = true; };
    }, [apiUrl]);

    // Derive options: empty when no API mapping or stale fetch
    const options = useMemo(() => {
        if (!apiUrl || fetchedForUrl !== apiUrl) return [];
        return fetchedOptions;
    }, [apiUrl, fetchedForUrl, fetchedOptions]);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <div className="flex gap-2">
                <Select value={typeValue} onValueChange={onTypeChange}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {TERMINATION_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={idValue} onValueChange={onIdChange} disabled={options.length === 0}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select port" />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                                {opt.deviceName} - {opt.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
