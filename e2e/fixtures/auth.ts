import { test, expect, type Page } from "@playwright/test";

// Re-export for convenient imports in spec files
export { test, expect };

// Seeded admin credentials (db/seed.ts)
export const ADMIN_EMAIL = "admin@dcim.local";
export const ADMIN_PASSWORD = "admin1234";

// Login via the UI form (for tests that perform a fresh login)
export async function loginViaUI(
    page: Page,
    email = ADMIN_EMAIL,
    password = ADMIN_PASSWORD,
): Promise<void> {
    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 20000 });
}

// Logout via the user-nav dropdown in the site header
export async function logoutViaUI(page: Page): Promise<void> {
    // The user-nav button shows the admin email as its text
    await page.getByRole("button").filter({ hasText: ADMIN_EMAIL }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await page.waitForURL("**/login", { timeout: 10000 });
}
