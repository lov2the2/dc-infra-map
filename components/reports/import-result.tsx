"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ImportResultProps {
    imported: number;
    errorCount: number;
}

export function ImportResult({ imported, errorCount }: ImportResultProps) {
    return (
        <div className="space-y-3">
            {imported > 0 && (
                <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Import Successful</AlertTitle>
                    <AlertDescription>
                        {imported} record{imported !== 1 ? "s" : ""} imported successfully.
                    </AlertDescription>
                </Alert>
            )}
            {errorCount > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Import Errors</AlertTitle>
                    <AlertDescription>
                        {errorCount} row{errorCount !== 1 ? "s" : ""} could not be imported due to validation errors.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
