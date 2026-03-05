"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRackStore } from "@/stores/use-rack-store";
import type { Device, DeviceType } from "@/types/entities";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const DEVICE_STATUSES = [
    "active",
    "planned",
    "staged",
    "failed",
    "decommissioning",
    "decommissioned",
];

interface RackOption {
    id: string;
    name: string;
}

interface DeviceEditDialogProps {
    device: (Device & { deviceType: DeviceType }) | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    locationId?: string;
}

export function DeviceEditDialog({ device, open, onOpenChange, locationId }: DeviceEditDialogProps) {
    const router = useRouter();
    const { updateDevice } = useRackStore();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [status, setStatus] = useState("active");
    const [serialNumber, setSerialNumber] = useState("");
    const [assetTag, setAssetTag] = useState("");
    const [primaryIp, setPrimaryIp] = useState("");
    const [description, setDescription] = useState("");

    // Rack move state
    const [rackOptions, setRackOptions] = useState<RackOption[]>([]);
    const [rackSearch, setRackSearch] = useState("");
    const [targetRackId, setTargetRackId] = useState<string>("");

    // Sync form fields when device changes
    useEffect(() => {
        if (device) {
            setName(device.name ?? "");
            setStatus(device.status ?? "active");
            setSerialNumber(device.serialNumber ?? "");
            setAssetTag(device.assetTag ?? "");
            setPrimaryIp(device.primaryIp ?? "");
            setDescription(device.description ?? "");
            setTargetRackId(device.rackId ?? "");
            setRackSearch("");
            setError(null);
        }
    }, [device]);

    // Fetch racks in the same location when dialog opens
    const fetchRacks = useCallback(async () => {
        if (!locationId) return;
        try {
            const res = await fetch(`/api/racks/location/${locationId}`);
            if (res.ok) {
                const json = await res.json();
                setRackOptions(json.data ?? []);
            }
        } catch {
            // Non-critical — rack move feature just won't show options
        }
    }, [locationId]);

    useEffect(() => {
        if (open && locationId) {
            fetchRacks();
        }
    }, [open, locationId, fetchRacks]);

    const filteredRacks = rackOptions.filter((r) =>
        r.name.toLowerCase().includes(rackSearch.toLowerCase()),
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!device || !name.trim()) return;

        setSubmitting(true);
        setError(null);
        try {
            const updates: Record<string, unknown> = {
                name: name.trim(),
                status,
                serialNumber: serialNumber.trim() || null,
                assetTag: assetTag.trim() || null,
                primaryIp: primaryIp.trim() || null,
                description: description.trim() || null,
            };

            const isMovingRack = targetRackId && targetRackId !== device.rackId;
            if (isMovingRack) {
                updates.rackId = targetRackId;
            }

            await updateDevice(device.id, updates);
            onOpenChange(false);

            if (isMovingRack) {
                router.push(`/racks/${targetRackId}`);
            }
        } catch {
            setError("저장에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!device) return null;

    const currentRackName = rackOptions.find((r) => r.id === device.rackId)?.name;
    const targetRackName = rackOptions.find((r) => r.id === targetRackId)?.name;
    const isMovingRack = targetRackId && targetRackId !== device.rackId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>서버 정보 편집</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="device-name">이름 *</Label>
                        <Input
                            id="device-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="device-status">상태</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="device-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DEVICE_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="device-serial">시리얼 번호</Label>
                        <Input
                            id="device-serial"
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="device-asset">자산 태그</Label>
                        <Input
                            id="device-asset"
                            value={assetTag}
                            onChange={(e) => setAssetTag(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="device-ip">기본 IP</Label>
                        <Input
                            id="device-ip"
                            value={primaryIp}
                            onChange={(e) => setPrimaryIp(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="device-desc">설명</Label>
                        <Textarea
                            id="device-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {locationId && rackOptions.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label>랙 이동</Label>
                                <p className="text-xs text-muted-foreground">
                                    현재 랙: <span className="font-medium">{currentRackName ?? device.rackId}</span>
                                </p>
                                <Input
                                    placeholder="랙 이름 검색..."
                                    value={rackSearch}
                                    onChange={(e) => setRackSearch(e.target.value)}
                                />
                                {rackSearch && (
                                    <div className="max-h-40 overflow-y-auto rounded-md border bg-popover text-sm shadow-md">
                                        {filteredRacks.length === 0 ? (
                                            <p className="p-2 text-muted-foreground text-center">결과 없음</p>
                                        ) : (
                                            filteredRacks.map((r) => (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    className={`w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors ${
                                                        targetRackId === r.id ? "bg-accent font-medium" : ""
                                                    }`}
                                                    onClick={() => {
                                                        setTargetRackId(r.id);
                                                        setRackSearch("");
                                                    }}
                                                >
                                                    {r.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                                {isMovingRack && (
                                    <p className="text-xs text-primary">
                                        → <span className="font-medium">{targetRackName}</span>으로 이동 예정
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            취소
                        </Button>
                        <Button type="submit" disabled={submitting || !name.trim()}>
                            {submitting ? "저장 중..." : isMovingRack ? "저장 및 이동" : "저장"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
