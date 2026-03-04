import { test, expect } from "@playwright/test";

// Registration page tests — unauthenticated state
test.describe("Registration page", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("loads correctly and shows registration form", async ({ page }) => {
        await page.goto("/register");
        await expect(page).toHaveTitle(/DC Infra Map/);
        // Card title should say "Register"
        await expect(page.locator('[data-slot="card-title"]')).toContainText("Register");
        // Form fields visible
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
        await expect(page.getByLabel(/confirm password/i)).toBeVisible();
        // Submit button visible
        await expect(page.getByRole("button", { name: /register/i })).toBeVisible();
    });

    test("has link to login page", async ({ page }) => {
        await page.goto("/register");
        // "Sign in" link should be present and point to /login
        const signInLink = page.getByRole("link", { name: /sign in/i });
        await expect(signInLink).toBeVisible();
        await expect(signInLink).toHaveAttribute("href", "/login");
    });

    test("shows validation error when passwords do not match", async ({ page }) => {
        await page.goto("/register");
        await page.fill("#email", "test@example.com");
        await page.fill("#password", "password123");
        await page.fill("#confirmPassword", "different123");
        await page.click('button[type="submit"]');
        await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test("shows validation error when password is too short", async ({ page }) => {
        await page.goto("/register");
        await page.fill("#email", "test@example.com");
        // minLength=8 enforced by browser and JS — override minlength on both fields via JS eval
        await page.evaluate(() => {
            const pwd = document.getElementById("password") as HTMLInputElement;
            if (pwd) pwd.removeAttribute("minlength");
            const confirm = document.getElementById("confirmPassword") as HTMLInputElement;
            if (confirm) confirm.removeAttribute("minlength");
        });
        await page.fill("#password", "short");
        await page.fill("#confirmPassword", "short");
        await page.click('button[type="submit"]');
        // Actual validation message: "Password must be at least 8 characters."
        await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    });
});

// Forgot password page tests — unauthenticated state
test.describe("Forgot password page", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("loads correctly and shows email form", async ({ page }) => {
        await page.goto("/forgot-password");
        await expect(page).toHaveTitle(/DC Infra Map/);
        // Card title should say "Forgot Password"
        await expect(page.locator('[data-slot="card-title"]')).toContainText("Forgot Password");
        // Email input visible
        await expect(page.getByLabel(/email/i)).toBeVisible();
        // Submit button visible
        await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
    });

    test("has link back to login", async ({ page }) => {
        await page.goto("/forgot-password");
        // "Sign in" link should be present and point to /login
        const signInLink = page.getByRole("link", { name: /sign in/i });
        await expect(signInLink).toBeVisible();
        await expect(signInLink).toHaveAttribute("href", "/login");
    });
});

// Reset password page tests — unauthenticated state
test.describe("Reset password page", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("loads correctly and shows password form", async ({ page }) => {
        await page.goto("/reset-password?email=test@example.com&token=test-token");
        await expect(page).toHaveTitle(/DC Infra Map/);
        // Card title should say "Reset Password"
        await expect(page.locator('[data-slot="card-title"]')).toContainText("Reset Password");
        // New password fields visible
        await expect(page.getByLabel("New Password")).toBeVisible();
        await expect(page.getByLabel(/confirm password/i)).toBeVisible();
        // Submit button visible
        await expect(page.getByRole("button", { name: /reset password/i })).toBeVisible();
    });

    test("has link back to sign in", async ({ page }) => {
        await page.goto("/reset-password?email=test@example.com&token=test-token");
        const backLink = page.getByRole("link", { name: /back to sign in/i });
        await expect(backLink).toBeVisible();
        await expect(backLink).toHaveAttribute("href", "/login");
    });
});

// Login page links tests — unauthenticated state
test.describe("Login page links", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("has forgot password link", async ({ page }) => {
        await page.goto("/login");
        const forgotLink = page.getByRole("link", { name: /forgot your password/i });
        await expect(forgotLink).toBeVisible();
        await expect(forgotLink).toHaveAttribute("href", "/forgot-password");
    });

    test("has register link", async ({ page }) => {
        await page.goto("/login");
        const registerLink = page.getByRole("link", { name: /register/i });
        await expect(registerLink).toBeVisible();
        await expect(registerLink).toHaveAttribute("href", "/register");
    });

    test("clicking forgot password navigates to forgot-password page", async ({ page }) => {
        await page.goto("/login");
        await page.getByRole("link", { name: /forgot your password/i }).click();
        await expect(page).toHaveURL(/\/forgot-password/);
    });

    test("clicking register navigates to register page", async ({ page }) => {
        await page.goto("/login");
        await page.getByRole("link", { name: /register/i }).click();
        await expect(page).toHaveURL(/\/register/);
    });
});
