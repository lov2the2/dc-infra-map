import { test, expect } from "@playwright/test";

// Note: These tests require authentication. In CI, set up auth state or use test credentials.
// For local development, tests assume a running dev server with seeded data.

test.describe("Dashboard (unauthenticated)", () => {
    test("redirects to login when not authenticated", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveURL(/\/login/);
    });

    test("redirects dashboard to login when not authenticated", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page).toHaveURL(/\/login/);
    });
});
