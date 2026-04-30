import { expect, type Page } from "@playwright/test";
import { resetRootAdminCredential } from "./db";

let rootCredentialReady = false;

async function ensureRootAdminCredential() {
    if (rootCredentialReady) return;
    await resetRootAdminCredential("r00tme");
    rootCredentialReady = true;
}

export async function loginAsRootAdmin(page: Page) {
    await ensureRootAdminCredential();
    await page.goto("/auth/sign-in");
    await page.getByPlaceholder("Email").fill("root@admin.com");
    await page.getByPlaceholder("Password").fill("r00tme");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).not.toHaveURL(/\/auth\/sign-in$/);
}
