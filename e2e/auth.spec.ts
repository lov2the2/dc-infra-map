import { test, expect } from "@playwright/test";
import { loginViaUI, logoutViaUI, ADMIN_EMAIL, ADMIN_PASSWORD } from "./fixtures/auth";

// Login page is accessible regardless of auth state (middleware allows /login publicly)
test.describe("Login page", () => {
    test("loads correctly", async ({ page }) => {
        await page.goto("/login");
        await expect(page).toHaveTitle(/DC Infra Map/);
        // CardTitle renders as a div, not a semantic heading
        await expect(page.locator('[data-slot="card-title"]')).toContainText("Login");
    });

    test("has email, password fields and submit button", async ({ page }) => {
        await page.goto("/login");
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });
});

// Unauthenticated redirect tests — override project-level storageState
test.describe("Unauthenticated redirects", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("unauthenticated user is redirected to login from /dashboard", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page).toHaveURL(/\/login/);
    });

    test("unauthenticated user is redirected to login from /devices", async ({ page }) => {
        await page.goto("/devices");
        await expect(page).toHaveURL(/\/login/);
    });
});

// Login / Logout flow — start each test with a clean session
test.describe("Login / Logout flow", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("valid credentials redirect to dashboard", async ({ page }) => {
        await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    });

    test("invalid credentials show error message", async ({ page }) => {
        await page.goto("/login");
        await page.fill("#email", "wrong@example.com");
        await page.fill("#password", "wrongpassword");
        await page.click('button[type="submit"]');

        await expect(page.getByText(/invalid email or password/i)).toBeVisible();
        await expect(page).toHaveURL(/\/login/);
    });

    test("logout redirects to login page", async ({ page }) => {
        // Login first
        await loginViaUI(page);
        await expect(page).toHaveURL(/\/dashboard/);

        // Then logout via user-nav dropdown
        await logoutViaUI(page);
        await expect(page).toHaveURL(/\/login/);

        // Verify the login form is shown again
        await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });
});
