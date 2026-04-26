import { expect, test } from "@playwright/test";
import { createUserAndOrganization, logoutViaApi } from "./helpers/admin";
import { loginAsRootAdmin } from "./helpers/auth";
import { markUserEmailVerified, seedPasswordResetToken } from "./helpers/db";

test.describe("Password reset auto-login", () => {
    test("resets password and lands authenticated", async ({ page }) => {
        const nonce = Date.now();
        const email = `e2e.reset.${nonce}@example.com`;
        const organizationName = `Reset Org ${nonce}`;
        const newPassword = "ResetPass123!";

        await test.step("Create a user account as root admin", async () => {
            await loginAsRootAdmin(page);
            await createUserAndOrganization(page, {
                fullName: "Reset Flow User",
                email,
                organizationName,
                password: "TempPass123!",
            });
        });

        await test.step("Sign out before reset flow", async () => {
            markUserEmailVerified(email);
            await logoutViaApi(page);
            await expect(page).toHaveURL(/\/auth\/sign-in$/);
        });

        await test.step("Request reset email and capture token from local D1", async () => {
            // Seed token using Better Auth's expected identifier/value format.
        });

        const token = seedPasswordResetToken(email);

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
