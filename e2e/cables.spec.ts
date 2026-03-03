import { test, expect } from "@playwright/test";

test.describe("Cables", () => {
    test("cables list page loads", async ({ page }) => {
        await page.goto("/cables");
        await expect(page).toHaveURL(/\/cables/);
        // Page should have cable table or empty state
        await expect(page.locator("table, [data-testid=\"empty-state\"], h1")).toBeVisible();
    });
});
