import type { ZodSchema, ZodError } from "zod/v4";

export interface CsvValidationError {
    row: number;
    field: string;
    message: string;
}

export interface CsvValidationResult<T> {
    valid: T[];
    errors: CsvValidationError[];
}

export function parseCsv(text: string): Record<string, string>[] {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCsvLine(line);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
            row[header] = values[index]?.trim().replace(/^"|"$/g, "") ?? "";
        });
        rows.push(row);
    }

    return rows;
}

function parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            values.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    values.push(current);
    return values;
}

export function validateRows<T>(
    rows: Record<string, string>[],
    schema: ZodSchema<T>,
): CsvValidationResult<T> {
    const valid: T[] = [];
    const errors: CsvValidationError[] = [];

    rows.forEach((row, index) => {
        const result = schema.safeParse(row);
        if (result.success) {
            valid.push(result.data);
        } else {
            const zodError = result.error as ZodError;
            for (const issue of zodError.issues) {
                errors.push({
                    row: index + 2, // +2 for header row and 0-index
                    field: issue.path.join("."),
                    message: issue.message,
                });
            }
        }
    });

    return { valid, errors };
}
