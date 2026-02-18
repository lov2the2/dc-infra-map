import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
    test("login page loads", async ({ page }) => {
        await page.goto("/login");
        await expect(page).toHaveTitle(/DC Infrastructure Map/);
        await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    });

    test("unauthenticated user is redirected to login", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page).toHaveURL(/\/login/);
    });

    test("login form has email and password fields", async ({ page }) => {
        await page.goto("/login");
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });
});
