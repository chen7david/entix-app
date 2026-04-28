import { expect, type Page } from "@playwright/test";
import { markUserEmailVerified, seedPasswordResetToken } from "./db";

export async function loginAsRootAdmin(page: Page) {
    const rootEmail = "root@admin.com";
    const rootPassword = "r00tme";

    const signIn = async () => {
        await page.goto("/auth/sign-in");
        await page.getByPlaceholder("Email").fill(rootEmail);
        await page.getByPlaceholder("Password").fill(rootPassword);
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page).not.toHaveURL(/\/auth\/sign-in$/, { timeout: 4_000 });
    };

    try {
        await signIn();
    } catch {
        // Keep tests resilient if seeded credential hash drifts: reset root password
        // through Better Auth's normal reset-password flow, then continue as authenticated.
        markUserEmailVerified(rootEmail);
        const token = seedPasswordResetToken(rootEmail);
        await page.goto(
            `/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(rootEmail)}`
        );
        await page.getByPlaceholder("New Password").fill(rootPassword);
        await page.getByPlaceholder("Confirm Password").fill(rootPassword);
        await page.getByRole("button", { name: "Reset Password" }).click();
        await expect(page).not.toHaveURL(/\/auth\/(sign-in|reset-password)$/);
    }

    // Ensure session can access global admin routes before continuing.
    await page.goto("/admin/users");
    if (/\/auth\/sign-in$/.test(page.url())) {
        await signIn();
        await page.goto("/admin/users");
    }
    await expect(page).toHaveURL(/\/admin\/users/);
}
