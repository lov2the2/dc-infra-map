import ExcelJS from "exceljs";

export interface ColumnDef {
    header: string;
    key: string;
    width?: number;
}

export function createWorkbook(): ExcelJS.Workbook {
    const wb = new ExcelJS.Workbook();
    wb.creator = "DC Infra Map";
    wb.created = new Date();
    return wb;
}

export function addSheet(
    wb: ExcelJS.Workbook,
    name: string,
    columns: ColumnDef[],
    rows: Record<string, unknown>[],
): ExcelJS.Worksheet {
    const ws = wb.addWorksheet(name);
    ws.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width ?? 20,
    }));

    for (const row of rows) {
        ws.addRow(row);
    }

    styleHeader(ws);
    autoColumnWidth(ws, columns);
    return ws;
}

function styleHeader(ws: ExcelJS.Worksheet): void {
    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1F2937" },
        };
        cell.border = {
            bottom: { style: "thin", color: { argb: "FF374151" } },
        };
        cell.alignment = { vertical: "middle", horizontal: "left" };
    });
    headerRow.height = 24;
}

function autoColumnWidth(ws: ExcelJS.Worksheet, columns: ColumnDef[]): void {
    ws.columns.forEach((col, index) => {
        const headerLen = columns[index]?.header.length ?? 10;
        let maxLen = headerLen;

        col.eachCell?.({ includeEmpty: false }, (cell) => {
            const cellLen = String(cell.value ?? "").length;
            if (cellLen > maxLen) maxLen = cellLen;
        });

        col.width = Math.min(Math.max(maxLen + 2, 10), 50);
    });
}

export async function workbookToBlob(wb: ExcelJS.Workbook): Promise<Blob> {
    const buffer = await wb.xlsx.writeBuffer();
    return new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
}

export async function excelResponse(wb: ExcelJS.Workbook, filename: string): Promise<Response> {
    const blob = await workbookToBlob(wb);
    return new Response(blob, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
