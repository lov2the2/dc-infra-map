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

    // Build a FormData payload with the CSV file as a "file" field.
    // All import endpoints (Go multipart handlers and Next.js bulk-import routes)
    // accept multipart/form-data with a "file" field containing the CSV blob.
    function buildFormData(file: File): FormData {
        const formData = new FormData();
        formData.append("file", new Blob([file], { type: "text/csv" }), file.name);
        return formData;
    }

    // Normalise the raw JSON response from any import endpoint into a consistent
    // shape.  Go handlers return a flat { imported, errors } object while Next.js
    // bulk-import handlers wrap their payload in a "data" key.
    function normaliseResponse(result: Record<string, unknown>): {
        valid: Record<string, unknown>[];
        errors: { row: number; field: string; message: string }[];
        imported: number;
    } {
        // Next.js bulk-import format: { data: { valid?, errors?, imported? } }
        const payload = (result.data ?? result) as Record<string, unknown>;
        return {
            valid: (payload.valid as Record<string, unknown>[]) ?? [],
            errors: (payload.errors as { row: number; field: string; message: string }[]) ?? [],
            imported: (payload.imported as number) ?? 0,
        };
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setState("validating");
        try {
            // Do NOT set Content-Type manually — the browser sets it with the
            // correct multipart boundary when FormData is used.
            const response = await fetch(importEndpoint, {
                method: "POST",
                body: buildFormData(file),
            });
            const result = await response.json();

            if (!response.ok) {
                setErrors([{ row: 0, field: "", message: (result.error as string) ?? "Validation failed" }]);
                setState("preview");
                return;
            }

            const normalised = normaliseResponse(result as Record<string, unknown>);

            // Go import handlers (devices, cables) have no validate-only mode —
            // they import immediately and return { imported, errors } with no
            // "valid" preview rows.  In that case skip the preview step and
            // go straight to "done" so the data is not imported a second time.
            if (normalised.valid.length === 0 && (normalised.imported > 0 || normalised.errors.length > 0)) {
                setImportedCount(normalised.imported);
                setErrors(normalised.errors);
                setState("done");
                return;
            }

            setValidRows(normalised.valid);
            setErrors(normalised.errors);
            setState("preview");
        } catch {
            setErrors([{ row: 0, field: "", message: "Failed to process file" }]);
            setState("preview");
        }
    }

    async function handleConfirmImport() {
        setState("importing");
        try {
            const file = fileInputRef.current?.files?.[0];
            if (!file) return;

            const response = await fetch(`${importEndpoint}?confirm=true`, {
                method: "POST",
                body: buildFormData(file),
            });
            const result = await response.json();

            const normalised = normaliseResponse(result as Record<string, unknown>);
            setImportedCount(normalised.imported);
            setErrors(normalised.errors);
            setState("done");
        } catch {
            setErrors([{ row: 0, field: "", message: "Import failed" }]);
            setState("done");
        }
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
