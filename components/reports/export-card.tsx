"use client";

import { useState, useCallback } from "react";
import { Download, FileSpreadsheet, FileCode, Loader2 } from "lucide-react";
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
import { ExportFilters } from "./export-filters";

type ExportFormat = "xlsx" | "xml";

interface ExportCardProps {
    title: string;
    description: string;
    formats: ExportFormat[];
    endpoint: string;
    showSite?: boolean;
    showDateRange?: boolean;
    showTenant?: boolean;
}

export function ExportCard({
    title,
    description,
    formats,
    endpoint,
    showSite = false,
    showDateRange = false,
    showTenant = false,
}: ExportCardProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filterParams, setFilterParams] = useState("");

    const hasFilters = showSite || showDateRange || showTenant;

    const handleFiltersChange = useCallback((params: string) => {
        setFilterParams(params);
    }, []);

    async function handleDownload(format: ExportFormat) {
        setLoading(true);
        try {
            const url = format === "xml"
                ? `/api/export/xml/${endpoint.replace("/api/export/", "")}${filterParams ? `?${filterParams}` : ""}`
                : `${endpoint}${filterParams ? `?${filterParams}` : ""}`;

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
            setOpen(false);
        } catch {
            // Error is visible via failed download
        } finally {
            setLoading(false);
        }
    }

    function handleDirectDownload(format: ExportFormat) {
        if (hasFilters) {
            setOpen(true);
        } else {
            handleDownload(format);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Download className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {hasFilters ? (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <div className="flex gap-2">
                            {formats.map((format) => (
                                <DialogTrigger key={format} asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={loading}
                                    >
                                        {format === "xlsx" ? (
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        ) : (
                                            <FileCode className="mr-2 h-4 w-4" />
                                        )}
                                        {format.toUpperCase()}
                                    </Button>
                                </DialogTrigger>
                            ))}
                        </div>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Export {title}</DialogTitle>
                                <DialogDescription>
                                    Apply filters before exporting.
                                </DialogDescription>
                            </DialogHeader>
                            <ExportFilters
                                showSite={showSite}
                                showDateRange={showDateRange}
                                showTenant={showTenant}
                                onFiltersChange={handleFiltersChange}
                            />
                            <DialogFooter>
                                <div className="flex gap-2">
                                    {formats.map((format) => (
                                        <Button
                                            key={format}
                                            onClick={() => handleDownload(format)}
                                            disabled={loading}
                                        >
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {format === "xlsx" ? (
                                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            ) : (
                                                <FileCode className="mr-2 h-4 w-4" />
                                            )}
                                            Download {format.toUpperCase()}
                                        </Button>
                                    ))}
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                ) : (
                    <div className="flex gap-2">
                        {formats.map((format) => (
                            <Button
                                key={format}
                                variant="outline"
                                size="sm"
                                onClick={() => handleDirectDownload(format)}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {format === "xlsx" ? (
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                ) : (
                                    <FileCode className="mr-2 h-4 w-4" />
                                )}
                                {format.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
