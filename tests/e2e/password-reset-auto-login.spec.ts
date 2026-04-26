import { expect, test } from "@playwright/test";
import { getLatestResetTokenForEmail } from "./helpers/db";

test.describe("Password reset auto-login", () => {
    test("resets password and lands authenticated", async ({ page }) => {
        const nonce = Date.now();
        const email = `e2e.reset.${nonce}@example.com`;
        const initialPassword = "InitialPass123!";
        const newPassword = "ResetPass123!";

        await test.step("Create a user account", async () => {
            await page.goto("/auth/sign-up");
            await page.getByPlaceholder("Full Name").fill("Reset Flow User");
            await page.getByPlaceholder("Email").fill(email);
            await page.getByPlaceholder("Organization Name").fill(`Reset Org ${nonce}`);
            await page.getByPlaceholder("Password").fill(initialPassword);
            await page.getByRole("button", { name: "Sign Up" }).click();
            await expect(page).not.toHaveURL(/\/auth\/sign-up$/);
        });

        await test.step("Sign out before reset flow", async () => {
            await page.request.post("/api/v1/auth/sign-out");
            await page.goto("/auth/sign-in");
            await expect(page).toHaveURL(/\/auth\/sign-in$/);
        });

        await test.step("Request reset email and capture token from local D1", async () => {
            await page.goto("/auth/forgot-password");
            await page.getByPlaceholder("Email").fill(email);
            await page.getByRole("button", { name: "Send Reset Link" }).click();
            await expect(page.getByText("Check your email")).toBeVisible();
        });

        const token = await getLatestResetTokenForEmail(email);

        await test.step("Complete reset and verify auto-login redirect", async () => {
            await page.goto(
                `/auth/reset-password?token=${encodeURIComponent(token)}&email=${email}`
            );
            await page.getByPlaceholder("New Password").fill(newPassword);
            await page.getByPlaceholder("Confirm Password").fill(newPassword);
            await page.getByRole("button", { name: "Reset Password" }).click();

            await expect(page).not.toHaveURL(/\/auth\/(sign-in|reset-password)$/);
            await expect(page).toHaveURL(/\/(org|admin|onboarding)\//);
        });
    });
});
