import { test, expect } from "@playwright/test";

test.describe("Devices (unauthenticated)", () => {
    test("redirects to login when not authenticated", async ({ page }) => {
        await page.goto("/devices");
        await expect(page).toHaveURL(/\/login/);
    });

    test("device detail redirects to login when not authenticated", async ({ page }) => {
        await page.goto("/devices/some-device-id");
        await expect(page).toHaveURL(/\/login/);
    });
});
