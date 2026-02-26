import { test, expect } from "@playwright/test";

// Unauthenticated redirects — clear project-level storageState
test.describe("Alerts (unauthenticated)", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("redirects to login when not authenticated", async ({ page }) => {
        await page.goto("/alerts");
        await expect(page).toHaveURL(/\/login/);
    });
});

// Authenticated access — uses project-level admin storageState
test.describe("Alerts (authenticated)", () => {
    test("admin can access alerts page without redirect", async ({ page }) => {
        await page.goto("/alerts");
        await expect(page).toHaveURL(/\/alerts/);
    });

    test("shows Alerts heading", async ({ page }) => {
        await page.goto("/alerts");
        await expect(page.getByRole("heading", { name: "Alerts", level: 1 })).toBeVisible({
            timeout: 10000,
        });
    });

    test("shows breadcrumb with Dashboard link", async ({ page }) => {
        await page.goto("/alerts");
        await expect(
            page.getByLabel("breadcrumb").getByRole("link", { name: "Dashboard" }),
        ).toBeVisible();
    });

    test("shows three tabs: Alert Rules, History, Channels", async ({ page }) => {
        await page.goto("/alerts");

        const tabList = page.getByRole("tablist");
        await expect(tabList).toBeVisible({ timeout: 10000 });
        await expect(tabList.getByRole("tab", { name: /alert rules/i })).toBeVisible();
        await expect(tabList.getByRole("tab", { name: /history/i })).toBeVisible();
        await expect(tabList.getByRole("tab", { name: /channels/i })).toBeVisible();
    });

    test("Alert Rules tab is active by default", async ({ page }) => {
        await page.goto("/alerts");

        const rulesTab = page.getByRole("tab", { name: /alert rules/i });
        await expect(rulesTab).toHaveAttribute("data-state", "active");
    });

    test("shows Run Evaluation button for admin role", async ({ page }) => {
        await page.goto("/alerts");
        await expect(page.getByRole("button", { name: /run evaluation/i })).toBeVisible({
            timeout: 10000,
        });
    });

    test("shows New Rule button for admin role", async ({ page }) => {
        await page.goto("/alerts");
        await expect(page.getByRole("button", { name: /new rule/i })).toBeVisible({
            timeout: 10000,
        });
    });
});

// Tab switching tests — verify Channels tab renders correctly
test.describe("Alerts Channels tab", () => {
    test("clicking Channels tab switches active tab", async ({ page }) => {
        await page.goto("/alerts");

        const channelsTab = page.getByRole("tab", { name: /channels/i });
        await channelsTab.click();
        await expect(channelsTab).toHaveAttribute("data-state", "active");
    });

    test("Channels tab shows Add Channel button for admin", async ({ page }) => {
        await page.goto("/alerts");

        await page.getByRole("tab", { name: /channels/i }).click();

        // Either channels list or empty state renders; Add Channel button always shows for admin
        await expect(page.getByRole("button", { name: /add channel/i })).toBeVisible({
            timeout: 10000,
        });
    });

    test("Channels tab panel content is visible after switching", async ({ page }) => {
        await page.goto("/alerts");

        await page.getByRole("tab", { name: /channels/i }).click();

        // The tab panel containing channels should be visible (not hidden)
        const channelPanel = page.getByRole("tabpanel");
        await expect(channelPanel).toBeVisible({ timeout: 10000 });
    });
});

// History tab tests
test.describe("Alerts History tab", () => {
    test("clicking History tab switches active tab", async ({ page }) => {
        await page.goto("/alerts");

        const historyTab = page.getByRole("tab", { name: /history/i });
        await historyTab.click();
        await expect(historyTab).toHaveAttribute("data-state", "active");
    });

    test("History tab panel is visible after switching", async ({ page }) => {
        await page.goto("/alerts");

        await page.getByRole("tab", { name: /history/i }).click();

        const historyPanel = page.getByRole("tabpanel");
        await expect(historyPanel).toBeVisible({ timeout: 10000 });
    });
});

// JSONB contract verification — intercept API responses to verify config field shape
test.describe("JSONB double-serialization regression (channels API contract)", () => {
    test("channels API returns config as an object, not a double-serialized string", async ({ page }) => {
        // Intercept the channels API call and capture the raw response body
        let capturedChannels: unknown = null;

        await page.route("**/api/alerts/channels", async (route) => {
            const response = await route.fetch();
            const body = await response.json();
            capturedChannels = body;
            await route.fulfill({ response });
        });

        await page.goto("/alerts");

        // Switch to Channels tab to trigger fetchChannels() via the store
        await page.getByRole("tab", { name: /channels/i }).click();

        // Wait for channels tab panel to fully render
        await page.getByRole("tabpanel").waitFor({ timeout: 10000 });

        // Evaluate captured response shape only when the API was actually called
        if (capturedChannels !== null) {
            const body = capturedChannels as { data?: unknown[] };
            const channels = body.data ?? [];

            for (const channel of channels) {
                const ch = channel as { config: unknown; name?: string };

                // The JSONB bug manifests as config being a double-serialized JSON string.
                // After the fix (json.RawMessage), config must be a plain object — NOT a string.
                expect(
                    typeof ch.config,
                    `channel "${ch.name ?? "unknown"}" config must be an object, not a string (JSONB double-serialization regression)`,
                ).toBe("object");

                // A double-serialized value starts with '{' as a string — detect this pattern
                if (typeof ch.config === "string") {
                    const raw = ch.config as string;
                    expect(
                        raw.startsWith("{"),
                        `channel config looks like a double-serialized JSON string: ${raw.slice(0, 80)}`,
                    ).toBe(false);
                }
            }
        }
    });

    test("alert rules API returns notificationChannels as an array, not a double-serialized string", async ({ page }) => {
        let capturedRules: unknown = null;

        await page.route("**/api/alerts/rules", async (route) => {
            const response = await route.fetch();
            const body = await response.json();
            capturedRules = body;
            await route.fulfill({ response });
        });

        await page.goto("/alerts");

        // Alert Rules tab is default — wait for panel to render
        await page.getByRole("tabpanel").waitFor({ timeout: 10000 });

        if (capturedRules !== null) {
            const body = capturedRules as { data?: unknown[] };
            const rules = body.data ?? [];

            for (const rule of rules) {
                const r = rule as { notificationChannels: unknown; name?: string };

                // The JSONB bug for alerts.go: notificationChannels should be an array, not string
                expect(
                    Array.isArray(r.notificationChannels),
                    `rule "${r.name ?? "unknown"}" notificationChannels must be an array, not a string (JSONB double-serialization regression)`,
                ).toBe(true);
            }
        }
    });
});
