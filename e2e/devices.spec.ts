import { test, expect } from "@playwright/test";

// Unauthenticated redirects — clear project-level storageState
test.describe("Devices (unauthenticated)", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("redirects to login when not authenticated", async ({ page }) => {
        await page.goto("/devices");
        await expect(page).toHaveURL(/\/login/);
    });

    test("device detail redirects to login when not authenticated", async ({ page }) => {
        await page.goto("/devices/some-device-id");
        await expect(page).toHaveURL(/\/login/);
    });
});

// Authenticated access — uses project-level admin storageState
test.describe("Devices (authenticated)", () => {
    test("admin can access devices list", async ({ page }) => {
        await page.goto("/devices");
        await expect(page).toHaveURL(/\/devices/);
    });

    test("shows Devices heading", async ({ page }) => {
        await page.goto("/devices");
        await expect(page.getByRole("heading", { name: "Devices" })).toBeVisible();
    });

    test("shows New Device button", async ({ page }) => {
        await page.goto("/devices");
        await expect(page.getByRole("link", { name: /new device/i })).toBeVisible();
    });

    test("search filter input is visible", async ({ page }) => {
        await page.goto("/devices");
        await expect(page.getByPlaceholder("Search devices...")).toBeVisible();
    });

    test("search filter updates URL with search param", async ({ page }) => {
        await page.goto("/devices");

        const searchInput = page.getByPlaceholder("Search devices...");
        await searchInput.fill("server");

        // DeviceFilters calls router.push on each keystroke, so wait for URL update
        await page.waitForURL(/search=server/, { timeout: 5000 });
        expect(page.url()).toContain("search=server");
    });

    test("status filter dropdown is visible", async ({ page }) => {
        await page.goto("/devices");
        // Select trigger shows "All statuses" placeholder
        await expect(page.getByText("All statuses")).toBeVisible();
    });

    test("breadcrumb contains Dashboard link", async ({ page }) => {
        await page.goto("/devices");
        // Two "Dashboard" links exist (header nav + breadcrumb); scope to breadcrumb nav
        await expect(
            page.getByLabel("breadcrumb").getByRole("link", { name: "Dashboard" }),
        ).toBeVisible();
    });
});
