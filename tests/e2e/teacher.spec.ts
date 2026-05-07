import { expect, test } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL ?? "teacher@test.com";
const TEACHER_PASSWORD = process.env.TEST_TEACHER_PASSWORD ?? "password";
const ORG_SLUG = process.env.TEST_ORG_SLUG ?? "test-org";

test.describe("Teacher flows", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE}/auth/sign-in`);
        await page.getByLabel(/email/i).fill(TEACHER_EMAIL);
        await page.getByLabel(/password/i).fill(TEACHER_PASSWORD);
        await page.getByRole("button", { name: /sign in/i }).click();
        await page.waitForURL(
            (url) => url.pathname.replace(/\/$/, "") === `/org/${ORG_SLUG}/dashboard`,
        );
    });

    test("teacher dashboard shows Upcoming Classes", async ({ page }) => {
        await expect(page.getByText(/Teacher Dashboard/i)).toBeVisible();
        await expect(page.getByText(/Upcoming Classes/i)).toBeVisible();
    });

    test("teaching sessions page loads", async ({ page }) => {
        await page.goto(`${BASE}/org/${ORG_SLUG}/teaching/sessions`);
        await expect(page).toHaveURL(/\/teaching\/sessions$/);
    });

    test("teaching students page loads", async ({ page }) => {
        await page.goto(`${BASE}/org/${ORG_SLUG}/teaching/students`);
        await expect(page).toHaveURL(/\/teaching\/students$/);
    });

    test("session detail stub page loads", async ({ page }) => {
        await page.goto(`${BASE}/org/${ORG_SLUG}/teaching/sessions/test-session-id`);
        await expect(page.getByText(/Session Workspace/i)).toBeVisible();
    });

    test("student detail stub page loads", async ({ page }) => {
        await page.goto(`${BASE}/org/${ORG_SLUG}/teaching/students/test-member-id`);
        await expect(page.getByText(/Student Profile/i)).toBeVisible();
    });

    test("vocabulary page loads for teacher", async ({ page }) => {
        await page.goto(`${BASE}/org/${ORG_SLUG}/teaching/vocabulary`);
        await expect(page).toHaveURL(/\/teaching\/vocabulary$/);
    });
});
