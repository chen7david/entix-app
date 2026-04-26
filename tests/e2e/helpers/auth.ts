import { expect, type Page } from "@playwright/test";

export async function loginAsRootAdmin(page: Page) {
    await page.goto("/auth/sign-in");
    await page.getByPlaceholder("Email").fill("root@admin.com");
    await page.getByPlaceholder("Password").fill("r00tme");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).not.toHaveURL(/\/auth\/sign-in$/);
    await expect(page).toHaveURL(/\/(org|admin|onboarding)\//);
}
