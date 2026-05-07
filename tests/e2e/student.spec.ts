import { expect, test } from "@playwright/test";

const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL ?? "student@test.com";
const STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD ?? "password";
const ORG_SLUG = process.env.TEST_ORG_SLUG ?? "test-org";

test.describe("Student flows", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/auth/sign-in");
        await page.getByLabel(/email/i).fill(STUDENT_EMAIL);
        await page.getByLabel(/password/i).fill(STUDENT_PASSWORD);
        await page.getByRole("button", { name: /sign in/i }).click();
        await page.waitForURL(
            (url) => url.pathname.replace(/\/$/, "") === `/org/${ORG_SLUG}/dashboard`
        );
    });

    test("lands on student dashboard and sees wallet balance", async ({ page }) => {
        await expect(page.getByText(/Welcome to Entix Academy/i)).toBeVisible();
        await expect(page.getByText(/E\$/)).toBeVisible();
    });

    test("navigates to My Lessons", async ({ page }) => {
        await page.goto(`/org/${ORG_SLUG}/dashboard/lessons`);
        await expect(page).toHaveURL(/\/lessons$/);
        await expect(page.getByRole("heading")).toBeVisible();
    });

    test("navigates to Shop", async ({ page }) => {
        await page.goto(`/org/${ORG_SLUG}/dashboard/shop`);
        await expect(page).toHaveURL(/\/shop$/);
    });

    test("navigates to Wallet", async ({ page }) => {
        await page.goto(`/org/${ORG_SLUG}/dashboard/wallet`);
        await expect(page).toHaveURL(/\/wallet$/);
    });

    test("student vocabulary page loads", async ({ page }) => {
        await page.goto(`/org/${ORG_SLUG}/dashboard/vocabulary`);
        await expect(page.getByText(/Vocabulary Practice/i)).toBeVisible();
    });

    test("student schedule page loads", async ({ page }) => {
        await page.goto(`/org/${ORG_SLUG}/dashboard/my-schedule`);
        await expect(page.getByText(/My Schedule/i)).toBeVisible();
    });
});
