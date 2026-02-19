import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const authDir = path.resolve("e2e/.auth");
const authFile = path.join(authDir, "admin.json");

setup("authenticate as admin", async ({ page }) => {
    // Ensure the .auth directory exists before saving state
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    await page.goto("/login");

    // Fill credentials from seeded admin user (db/seed.ts)
    await page.fill("#email", "admin@dcim.local");
    await page.fill("#password", "admin1234");
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard confirming successful login
    await page.waitForURL("**/dashboard", { timeout: 20000 });
    await expect(page).toHaveURL(/dashboard/);

    // Persist cookies and localStorage for all subsequent tests
    await page.context().storageState({ path: authFile });
});
