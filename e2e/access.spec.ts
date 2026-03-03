import { test, expect } from "@playwright/test";

test.describe("Access Logs", () => {
    test("access log list loads", async ({ page }) => {
        await page.goto("/access");
        await expect(page).toHaveURL(/\/access/);
        await expect(page.locator("h1, [class*=\"page-header\"]")).toBeVisible();
    });
});
