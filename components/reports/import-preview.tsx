"use client";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ImportPreviewProps {
    validRows: Record<string, unknown>[];
    errors: { row: number; field: string; message: string }[];
}

export function ImportPreview({ validRows, errors }: ImportPreviewProps) {
    const headers = validRows.length > 0 ? Object.keys(validRows[0]) : [];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Badge variant="default">{validRows.length} valid</Badge>
                {errors.length > 0 && (
                    <Badge variant="destructive">{errors.length} errors</Badge>
                )}
            </div>

            {validRows.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Valid Rows</h4>
                    <div className="max-h-48 overflow-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {headers.map((h) => (
                                        <TableHead key={h} className="text-xs">
                                            {h}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {validRows.slice(0, 10).map((row, i) => (
                                    <TableRow key={i}>
                                        {headers.map((h) => (
                                            <TableCell key={h} className="text-xs">
                                                {String(row[h] ?? "")}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {validRows.length > 10 && (
                        <p className="text-xs text-muted-foreground">
                            Showing 10 of {validRows.length} rows
                        </p>
                    )}
                </div>
            )}

            {errors.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-destructive">Errors</h4>
                    <div className="max-h-48 overflow-auto rounded-md border border-destructive/20">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Row</TableHead>
                                    <TableHead className="text-xs">Field</TableHead>
                                    <TableHead className="text-xs">Message</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {errors.map((err, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="text-xs">{err.row}</TableCell>
                                        <TableCell className="text-xs">{err.field}</TableCell>
                                        <TableCell className="text-xs text-destructive">
                                            {err.message}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
