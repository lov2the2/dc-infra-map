import { test, expect } from "@playwright/test";

// Unauthenticated redirects — clear project-level storageState
test.describe("Dashboard (unauthenticated)", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("redirects to login when not authenticated", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveURL(/\/login/);
    });

    test("redirects dashboard to login when not authenticated", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page).toHaveURL(/\/login/);
    });
});

// Authenticated access — uses project-level admin storageState
test.describe("Dashboard (authenticated)", () => {
    test("admin can access dashboard without redirect", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test("shows Dashboard heading", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    });

    test("shows overview stat cards (Sites, Racks, Devices)", async ({ page }) => {
        await page.goto("/dashboard");

        // Stat cards link to their respective pages
        await expect(page.getByRole("link", { name: /sites/i }).first()).toBeVisible();
        await expect(page.getByRole("link", { name: /racks/i }).first()).toBeVisible();
        await expect(page.getByRole("link", { name: /devices/i }).first()).toBeVisible();
    });

    test("shows session info card with admin email", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page.getByText("Session Info")).toBeVisible();
        await expect(page.getByText("admin@dcim.local")).toBeVisible();
    });

    test("site header navigation is visible", async ({ page }) => {
        await page.goto("/dashboard");
        // Desktop nav links rendered in <nav>
        const nav = page.locator("header nav");
        await expect(nav.getByRole("link", { name: "Devices" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Sites" })).toBeVisible();
    });
});
