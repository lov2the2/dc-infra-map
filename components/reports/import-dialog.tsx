"use client";

import { useState, useRef } from "react";
import { Upload, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { ImportPreview } from "./import-preview";
import { ImportResult } from "./import-result";

interface ImportDialogProps {
    title: string;
    templateEndpoint: string;
    importEndpoint: string;
    type: string;
}

type ImportState = "idle" | "validating" | "preview" | "importing" | "done";

export function ImportDialog({
    title,
    templateEndpoint,
    importEndpoint,
    type,
}: ImportDialogProps) {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<ImportState>("idle");
    const [validRows, setValidRows] = useState<Record<string, unknown>[]>([]);
    const [errors, setErrors] = useState<{ row: number; field: string; message: string }[]>([]);
    const [importedCount, setImportedCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function resetState() {
        setState("idle");
        setValidRows([]);
        setErrors([]);
        setImportedCount(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function handleTemplateDownload() {
        const response = await fetch(templateEndpoint);
        if (!response.ok) return;
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dcim-${type}-import-template.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setState("validating");
        try {
            const csvText = await file.text();
            const response = await fetch(importEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csv: csvText }),
            });
            const result = await response.json();

            if (!response.ok) {
                setErrors([{ row: 0, field: "", message: result.error ?? "Validation failed" }]);
                setState("preview");
                return;
            }

            setValidRows(result.data.valid ?? []);
            setErrors(result.data.errors ?? []);
            setState("preview");
        } catch {
            setErrors([{ row: 0, field: "", message: "Failed to process file" }]);
            setState("preview");
        }
    }

    async function handleConfirmImport() {
        setState("importing");
        try {
            const csvText = await readFileFromInput();
            if (!csvText) return;

            const response = await fetch(`${importEndpoint}?confirm=true`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csv: csvText }),
            });
            const result = await response.json();

            setImportedCount(result.data?.imported ?? 0);
            setErrors(result.data?.errors ?? []);
            setState("done");
        } catch {
            setErrors([{ row: 0, field: "", message: "Import failed" }]);
            setState("done");
        }
    }

    async function readFileFromInput(): Promise<string | null> {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return null;
        return file.text();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Upload className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>
                    Download a CSV template, fill it in, and upload to import.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleTemplateDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Template
                </Button>
                <Dialog
                    open={open}
                    onOpenChange={(v) => {
                        setOpen(v);
                        if (!v) resetState();
                    }}
                >
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Import CSV
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Import {title}</DialogTitle>
                            <DialogDescription>
                                Upload a CSV file to validate and import records.
                            </DialogDescription>
                        </DialogHeader>

                        {state === "idle" && (
                            <div className="space-y-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                                />
                            </div>
                        )}

                        {state === "validating" && (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <span className="ml-3 text-muted-foreground">Validating...</span>
                            </div>
                        )}

                        {state === "preview" && (
                            <ImportPreview validRows={validRows} errors={errors} />
                        )}

                        {state === "importing" && (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <span className="ml-3 text-muted-foreground">Importing...</span>
                            </div>
                        )}

                        {state === "done" && (
                            <ImportResult imported={importedCount} errorCount={errors.length} />
                        )}

                        <DialogFooter>
                            {state === "preview" && validRows.length > 0 && (
                                <Button onClick={handleConfirmImport}>
                                    Confirm Import ({validRows.length} rows)
                                </Button>
                            )}
                            {state === "done" && (
                                <Button onClick={() => { setOpen(false); resetState(); }}>
                                    Close
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
