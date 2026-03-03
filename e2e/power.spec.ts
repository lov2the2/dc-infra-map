import { test, expect } from "@playwright/test";

test.describe("Power Monitoring", () => {
    test("power dashboard loads", async ({ page }) => {
        await page.goto("/power");
        await expect(page).toHaveURL(/\/power/);
        await expect(page.locator("h1, [class*=\"page-header\"]")).toBeVisible();
    });
});
