"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TerminationSelect } from "@/components/cables/termination-select";
import { Plus } from "lucide-react";
import { CABLE_TYPES, CABLE_STATUSES } from "@/types/cable";

export function CableForm() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [label, setLabel] = useState("");
    const [cableType, setCableType] = useState("");
    const [status, setStatus] = useState("connected");
    const [length, setLength] = useState("");
    const [color, setColor] = useState("");
    const [description, setDescription] = useState("");
    const [termAType, setTermAType] = useState("interface");
    const [termAId, setTermAId] = useState("");
    const [termBType, setTermBType] = useState("interface");
    const [termBId, setTermBId] = useState("");

    const resetForm = () => {
        setLabel("");
        setCableType("");
        setStatus("connected");
        setLength("");
        setColor("");
        setDescription("");
        setTermAType("interface");
        setTermAId("");
        setTermBType("interface");
        setTermBId("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/cables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label,
                    cableType,
                    status,
                    length: length || null,
                    color: color || null,
                    description: description || null,
                    terminationAType: termAType,
                    terminationAId: termAId,
                    terminationBType: termBType,
                    terminationBId: termBId,
                }),
            });
            if (res.ok) {
                setOpen(false);
                resetForm();
                router.refresh();
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Cable
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Cable</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Label</label>
                            <Input
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g., CAB-001"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cable Type</label>
                            <Select value={cableType} onValueChange={setCableType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CABLE_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CABLE_STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Length (m)</label>
                            <Input
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                                placeholder="e.g., 3"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Color</label>
                            <Input
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                placeholder="e.g., blue"
                            />
                        </div>
                    </div>

                    <TerminationSelect
                        label="Termination A"
                        typeValue={termAType}
                        idValue={termAId}
                        onTypeChange={setTermAType}
                        onIdChange={setTermAId}
                    />

                    <TerminationSelect
                        label="Termination B"
                        typeValue={termBType}
                        idValue={termBId}
                        onTypeChange={setTermBType}
                        onIdChange={setTermBId}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={submitting || !label || !cableType || !termAId || !termBId}>
                            {submitting ? "Creating..." : "Create Cable"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
