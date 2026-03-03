import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

test.describe("Reports - CSV Import", () => {
    test("import API returns imported count not just success status", async ({ request }) => {
        // Create a temporary CSV file
        const csvContent = "name,status\nTest Device 1,active\nTest Device 2,active\n";
        const tmpFile = path.join(os.tmpdir(), "test-import.csv");
        fs.writeFileSync(tmpFile, csvContent);

        // Test the import API directly
        const response = await request.post("/api/import/devices", {
            multipart: {
                file: {
                    name: "test-import.csv",
                    mimeType: "text/csv",
                    buffer: Buffer.from(csvContent),
                },
            },
        });

        expect(response.ok()).toBeTruthy();
        const body = await response.json();

        // CRITICAL: Response must have 'imported' count, not just status string
        expect(body).toHaveProperty("imported");
        expect(typeof body.imported).toBe("number");
        // Should NOT just be {"status": "device import endpoint ready"}
        expect(body.imported !== undefined || body.errors !== undefined).toBeTruthy();

        // Clean up
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });

    test("import API returns error details for invalid rows", async ({ request }) => {
        // CSV with missing required name field
        const csvContent = "name,status\n,active\nValid Device,active\n";

        const response = await request.post("/api/import/devices", {
            multipart: {
                file: {
                    name: "test-errors.csv",
                    mimeType: "text/csv",
                    buffer: Buffer.from(csvContent),
                },
            },
        });

        expect(response.ok()).toBeTruthy();
        const body = await response.json();

        // Should have structured error info per row
        expect(body).toHaveProperty("errors");
        expect(Array.isArray(body.errors)).toBeTruthy();
    });
});
