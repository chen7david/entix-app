import { expect, test } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const PLATFORM_EMAIL = process.env.TEST_PLATFORM_ADMIN_EMAIL ?? "platform@test.com";
const PLATFORM_PASSWORD = process.env.TEST_PLATFORM_ADMIN_PASSWORD ?? "password";

test.describe("Platform admin flows", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE}/auth/sign-in`);
        await page.getByLabel(/email/i).fill(PLATFORM_EMAIL);
        await page.getByLabel(/password/i).fill(PLATFORM_PASSWORD);
        await page.getByRole("button", { name: /sign in/i }).click();
        await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === "/admin");
    });

    test("platform admin dashboard loads", async ({ page }) => {
        await expect(page).toHaveURL((url) => url.pathname.replace(/\/$/, "") === "/admin");
        await expect(page.getByRole("heading")).toBeVisible();
    });

    test("global users page loads", async ({ page }) => {
        await page.goto(`${BASE}/admin/users`);
        await expect(page).toHaveURL(/\/admin\/users$/);
    });

    test("global organizations page loads", async ({ page }) => {
        await page.goto(`${BASE}/admin/organizations`);
        await expect(page).toHaveURL(/\/admin\/organizations$/);
    });

    test("email insights page loads", async ({ page }) => {
        await page.goto(`${BASE}/admin/emails`);
        await expect(page).toHaveURL(/\/admin\/emails$/);
    });

    test("audit log page loads", async ({ page }) => {
        await page.goto(`${BASE}/admin/audit-logs`);
        await expect(page).toHaveURL(/\/admin\/audit-logs$/);
    });
});
