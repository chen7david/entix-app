import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? "admin@test.com";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "password";
const ORG_SLUG = process.env.TEST_ORG_SLUG ?? "test-org";

test.describe("Admin flows", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/auth/sign-in");
        await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
        await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
        await page.getByRole("button", { name: /sign in/i }).click();
        await page.waitForURL(
            (url) => url.pathname.replace(/\/$/, "") === `/org/${ORG_SLUG}/dashboard`
        );
    });

    test("admin dashboard shows KPI metric cards", async ({ page }) => {
        await expect(page.getByText(/Organization Dashboard/i)).toBeVisible();
        await expect(page.locator(".ant-statistic, .ant-card").first()).toBeVisible();
    });

    test("analytics page loads from admin index redirect", async ({ page }) => {
        await page.goto(`/org/${ORG_SLUG}/admin`);
        await expect(page).toHaveURL(/\/admin\/analytics$/);
    });

    test("members page loads", async ({ page }) => {
        await page.goto(`/org/${ORG_SLUG}/admin/members`);
        await expect(page).toHaveURL(/\/admin\/members$/);
    });

    test("invitations page loads", async ({ page }) => {
        await page.goto(`/org/${ORG_SLUG}/admin/invitations`);
        await expect(page).toHaveURL(/\/admin\/invitations$/);
    });

    test("billing accounts page loads", async ({ page }) => {
        await page.goto(`/org/${ORG_SLUG}/admin/billing/accounts`);
        await expect(page).toHaveURL(/\/billing\/accounts$/);
    });

    test("enrollment stub page loads", async ({ page }) => {
        await page.goto(`/org/${ORG_SLUG}/admin/enrollment`);
        await expect(page.getByText(/Enrollment Management/i)).toBeVisible();
    });

    test("member detail stub page loads", async ({ page }) => {
        await page.goto(`/org/${ORG_SLUG}/admin/members/test-id`);
        await expect(page.getByText(/Member Detail/i)).toBeVisible();
    });
});
