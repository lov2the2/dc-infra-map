'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Loader2 } from "lucide-react";

interface FloorSpaceConfigFormProps {
    locationId: string;
    initialGridCols: number;
    initialGridRows: number;
    onConfigSaved: (cols: number, rows: number) => void;
}

export function FloorSpaceConfigForm({
    locationId,
    initialGridCols,
    initialGridRows,
    onConfigSaved,
}: FloorSpaceConfigFormProps) {
    const [gridCols, setGridCols] = useState(initialGridCols);
    const [gridRows, setGridRows] = useState(initialGridRows);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalCells = gridCols * gridRows;

    const handleSave = async () => {
        if (gridCols < 1 || gridRows < 1 || gridCols > 50 || gridRows > 50) {
            setError("Grid size must be between 1 and 50 for both dimensions.");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`/api/floor-cells/${locationId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gridCols, gridRows }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error ?? "Failed to save grid configuration");
            }

            onConfigSaved(gridCols, gridRows);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4" />
                    Grid Configuration
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="grid-cols">Columns (Width)</Label>
                        <Input
                            id="grid-cols"
                            type="number"
                            min={1}
                            max={50}
                            value={gridCols}
                            onChange={(e) => setGridCols(Number(e.target.value))}
                            className="w-24"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="grid-rows">Rows (Depth)</Label>
                        <Input
                            id="grid-rows"
                            type="number"
                            min={1}
                            max={50}
                            value={gridRows}
                            onChange={(e) => setGridRows(Number(e.target.value))}
                            className="w-24"
                        />
                    </div>
                    <div className="flex items-end gap-3">
                        <Button onClick={handleSave} disabled={saving} size="sm">
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Configuration"
                            )}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Total floor spaces:{" "}
                            <span className="font-semibold text-foreground">{totalCells}</span>
                        </p>
                    </div>
                </div>
                {error && (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                )}
            </CardContent>
        </Card>
    );
}
