"use client";

import { useEffect, useState } from "react";
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

const DEVICE_STATUSES = [
    "active",
    "planned",
    "staged",
    "failed",
    "decommissioning",
    "decommissioned",
];

interface DeviceEditDialogProps {
    device: (Device & { deviceType: DeviceType }) | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeviceEditDialog({ device, open, onOpenChange }: DeviceEditDialogProps) {
    const { updateDevice } = useRackStore();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [status, setStatus] = useState("active");
    const [serialNumber, setSerialNumber] = useState("");
    const [assetTag, setAssetTag] = useState("");
    const [primaryIp, setPrimaryIp] = useState("");
    const [description, setDescription] = useState("");

    // Sync form fields when device changes
    useEffect(() => {
        if (device) {
            setName(device.name ?? "");
            setStatus(device.status ?? "active");
            setSerialNumber(device.serialNumber ?? "");
            setAssetTag(device.assetTag ?? "");
            setPrimaryIp(device.primaryIp ?? "");
            setDescription(device.description ?? "");
            setError(null);
        }
    }, [device]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!device || !name.trim()) return;

        setSubmitting(true);
        setError(null);
        try {
            await updateDevice(device.id, {
                name: name.trim(),
                status,
                serialNumber: serialNumber.trim() || null,
                assetTag: assetTag.trim() || null,
                primaryIp: primaryIp.trim() || null,
                description: description.trim() || null,
            });
            onOpenChange(false);
        } catch {
            setError("저장에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!device) return null;

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
                            {submitting ? "저장 중..." : "저장"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
