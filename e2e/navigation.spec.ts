import { test, expect } from "@playwright/test";

// All navigation tests use project-level admin storageState.
// Verifies that every nav link renders a page without error (h1 heading visible).
test.describe("Navigation (authenticated)", () => {
    const routes = [
        { label: "Dashboard", href: "/dashboard", heading: "Dashboard" },
        { label: "Sites", href: "/sites", heading: "Sites" },
        { label: "Regions", href: "/regions", heading: "Regions" },
        { label: "Devices", href: "/devices", heading: "Devices" },
        { label: "Tenants", href: "/tenants", heading: "Tenants" },
        { label: "Access", href: "/access", heading: "Access Management" },
        { label: "Power", href: "/power", heading: "Power Monitoring" },
        { label: "Cables", href: "/cables", heading: "Cables" },
        { label: "Topology", href: "/topology", heading: "Network Topology" },
        { label: "Reports", href: "/reports", heading: "Reports" },
        { label: "Alerts", href: "/alerts", heading: "Alerts" },
    ] as const;

    for (const { label, href, heading } of routes) {
        test(`${label} page (${href}) is accessible`, async ({ page }) => {
            await page.goto(href);

            // Must stay on the intended route (no redirect to login)
            await expect(page).toHaveURL(new RegExp(href));

            // Each page renders a <h1> via PageHeader
            await expect(
                page.getByRole("heading", { name: heading, level: 1 }),
            ).toBeVisible({ timeout: 10000 });
        });
    }

    test("admin users link is visible in user-nav dropdown", async ({ page }) => {
        await page.goto("/dashboard");

        // Open user-nav dropdown
        await page.getByRole("button").filter({ hasText: "admin@dcim.local" }).click();
        await expect(page.getByRole("menuitem", { name: "User Management" })).toBeVisible();
    });

    test("admin can access /admin/users page", async ({ page }) => {
        await page.goto("/admin/users");
        await expect(page).toHaveURL(/\/admin\/users/);
        await expect(page.getByRole("heading", { name: /user/i })).toBeVisible();
    });
});
