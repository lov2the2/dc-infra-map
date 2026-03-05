'use client'

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import type { LocationFloorCell } from "@/types/entities";

interface CellPayload {
    name?: string | null;
    isUnavailable?: boolean;
    notes?: string | null;
    posX?: number;
    posY?: number;
}

interface FloorSpaceCellDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    locationId: string;
    // When editing an existing cell
    cell?: LocationFloorCell | null;
    // When creating a new cell at a position
    createPosition?: { posX: number; posY: number } | null;
    onSaved: (cell: LocationFloorCell) => void;
    onDeleted?: (cellId: string) => void;
    // Rack placement (only shown for new floor spaces)
    availableRacks?: Array<{ id: string; name: string }>;
    onRackPositionUpdate?: (rackId: string, posX: number, posY: number) => Promise<void>;
}

export function FloorSpaceCellDialog({
    open,
    onOpenChange,
    locationId,
    cell,
    createPosition,
    onSaved,
    onDeleted,
    availableRacks,
    onRackPositionUpdate,
}: FloorSpaceCellDialogProps) {
    const isEditing = !!cell;
    const posX = cell?.posX ?? createPosition?.posX ?? 0;
    const posY = cell?.posY ?? createPosition?.posY ?? 0;

    const [name, setName] = useState(cell?.name ?? "");
    const [isUnavailable, setIsUnavailable] = useState(cell?.isUnavailable ?? false);
    const [notes, setNotes] = useState(cell?.notes ?? "");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRackId, setSelectedRackId] = useState<string | null>(null);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setName(cell?.name ?? "");
            setIsUnavailable(cell?.isUnavailable ?? false);
            setNotes(cell?.notes ?? "");
            setError(null);
            setSelectedRackId(null);
        }
    }, [open, cell]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const basePayload: CellPayload = {
                name: name.trim() || null,
                isUnavailable,
                notes: notes.trim() || null,
            };

            let res: Response;

            if (isEditing) {
                res = await fetch(
                    `/api/floor-cells/${locationId}/cells/${cell!.id}`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(basePayload),
                    },
                );
            } else {
                const createPayload: CellPayload = { ...basePayload, posX, posY };
                res = await fetch(`/api/floor-cells/${locationId}/cells`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(createPayload),
                });
            }

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error ?? "Failed to save floor space");
            }

            const json = await res.json();
            onSaved(json.data as LocationFloorCell);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!cell || !onDeleted) return;

        setDeleting(true);
        setError(null);

        try {
            const res = await fetch(
                `/api/floor-cells/${locationId}/cells/${cell.id}`,
                { method: "DELETE" },
            );

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error ?? "Failed to delete floor space");
            }

            onDeleted(cell.id);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete");
        } finally {
            setDeleting(false);
        }
    };

    const handlePlaceRack = async () => {
        if (!selectedRackId || !onRackPositionUpdate) return;
        setSaving(true);
        setError(null);
        try {
            await onRackPositionUpdate(selectedRackId, posX, posY);
            onOpenChange(false);
        } catch {
            setError("Failed to place rack");
        } finally {
            setSaving(false);
        }
    };

    const title = isEditing
        ? `Edit Floor Space (Col ${posX + 1}, Row ${posY + 1})`
        : `New Floor Space at (Col ${posX + 1}, Row ${posY + 1})`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="cell-name">Name (optional)</Label>
                        <Input
                            id="cell-name"
                            placeholder="e.g. A-01, Server Zone 1"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="cell-unavailable"
                            checked={isUnavailable}
                            onCheckedChange={(checked) =>
                                setIsUnavailable(checked === true)
                            }
                        />
                        <Label
                            htmlFor="cell-unavailable"
                            className="cursor-pointer font-normal"
                        >
                            Mark as unavailable (obstacle, column, restricted area)
                        </Label>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="cell-notes">Notes (optional)</Label>
                        <Textarea
                            id="cell-notes"
                            placeholder="Additional notes about this floor space..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {!isEditing && availableRacks && availableRacks.length > 0 && (
                        <>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">or</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Place a rack at this position</Label>
                                <Select
                                    value={selectedRackId ?? ""}
                                    onValueChange={(v) => setSelectedRackId(v || null)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a rack to place here..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableRacks.map((rack) => (
                                            <SelectItem key={rack.id} value={rack.id}>
                                                {rack.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {isEditing && onDeleted && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={deleting || saving}
                            className="sm:mr-auto"
                        >
                            {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            <span className="ml-1.5">Delete</span>
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving || deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={selectedRackId ? handlePlaceRack : handleSave}
                        disabled={saving || deleting}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : selectedRackId ? (
                            "Place Rack Here"
                        ) : isEditing ? (
                            "Save Changes"
                        ) : (
                            "Create Floor Space"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
