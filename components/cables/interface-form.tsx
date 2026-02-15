"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INTERFACE_TYPES } from "@/types/cable";

interface InterfaceFormProps {
    deviceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function InterfaceForm({ deviceId, open, onOpenChange, onSuccess }: InterfaceFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [interfaceType, setInterfaceType] = useState("");
    const [speed, setSpeed] = useState("");
    const [macAddress, setMacAddress] = useState("");

    const resetForm = () => {
        setName("");
        setInterfaceType("");
        setSpeed("");
        setMacAddress("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/interfaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deviceId,
                    name,
                    interfaceType,
                    speed: speed ? Number(speed) : null,
                    macAddress: macAddress || null,
                }),
            });
            if (res.ok) {
                onOpenChange(false);
                resetForm();
                onSuccess();
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Interface</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., eth0"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <Select value={interfaceType} onValueChange={setInterfaceType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INTERFACE_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Speed (Mbps)</label>
                            <Input
                                type="number"
                                value={speed}
                                onChange={(e) => setSpeed(e.target.value)}
                                placeholder="e.g., 1000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">MAC Address</label>
                            <Input
                                value={macAddress}
                                onChange={(e) => setMacAddress(e.target.value)}
                                placeholder="e.g., AA:BB:CC:DD:EE:FF"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button type="submit" disabled={submitting || !name || !interfaceType}>
                            {submitting ? "Creating..." : "Add Interface"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
