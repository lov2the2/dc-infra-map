"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExportFormat = "xlsx" | "xml";

interface ExportButtonProps {
    formats: ExportFormat[];
    baseEndpoint: string;
    currentFilters?: string;
}

export function ExportButton({ formats, baseEndpoint, currentFilters }: ExportButtonProps) {
    const [loading, setLoading] = useState(false);

    async function handleExport(format: ExportFormat) {
        setLoading(true);
        try {
            const endpoint = format === "xml"
                ? `/api/export/xml/${baseEndpoint.replace("/api/export/", "")}`
                : baseEndpoint;

            const url = currentFilters ? `${endpoint}?${currentFilters}` : endpoint;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;

            const disposition = response.headers.get("Content-Disposition");
            const filenameMatch = disposition?.match(/filename="(.+)"/);
            a.download = filenameMatch?.[1] ?? `export.${format}`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch {
            // Error is visible via failed download
        } finally {
            setLoading(false);
        }
    }

    if (formats.length === 1) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(formats[0])}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                )}
                Export
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={loading}>
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {formats.map((format) => (
                    <DropdownMenuItem
                        key={format}
                        onClick={() => handleExport(format)}
                    >
                        {format === "xlsx" ? (
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                        ) : (
                            <FileCode className="mr-2 h-4 w-4" />
                        )}
                        {format.toUpperCase()}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
