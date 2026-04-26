import { expect, type Locator, type Page } from "@playwright/test";

function rowForEmail(page: Page, email: string): Locator {
    return page.locator("tr", { hasText: email }).first();
}

async function openRowActions(page: Page, email: string) {
    const row = rowForEmail(page, email);
    await expect(row).toBeVisible();
    await row.locator("button").last().click();
}

async function clickVisibleRowMenuItem(page: Page, name: string) {
    const item = page.locator(".ant-dropdown:visible").getByRole("menuitem", { name }).first();
    await expect(item).toBeVisible();
    await item.evaluate((node) => {
        (node as HTMLElement).click();
    });
}

export async function createUserAndOrganization(
    page: Page,
    input: { fullName: string; email: string; organizationName: string; password: string }
) {
    await page.goto("/admin/organizations");
    await page.getByRole("button", { name: "Create User + Org" }).click();

    await page.getByPlaceholder("Full Name").fill(input.fullName);
    await page.getByPlaceholder("Email").fill(input.email);
    await page.getByPlaceholder("Organization Name").fill(input.organizationName);
    await page.getByPlaceholder("Password").fill(input.password);
    await page.getByRole("button", { name: "Create User & Organization" }).click();

    await expect(page.getByRole("dialog", { name: "Create User + Org" })).toBeHidden();
    await expect(page.locator("tr", { hasText: input.organizationName }).first()).toBeVisible();
}

export async function impersonateUserByEmail(page: Page, email: string) {
    await page.goto("/admin/users");
    await page.getByPlaceholder("Search users...").fill(email);
    await page.keyboard.press("Enter");
    await openRowActions(page, email);
    await clickVisibleRowMenuItem(page, "Impersonate");
    await expect(page.getByRole("button", { name: "Stop Impersonating" })).toBeVisible();
}

export async function stopImpersonating(page: Page) {
    await page.getByRole("button", { name: "Stop Impersonating" }).click();
    await expect(page).toHaveURL(/\/admin\/users/);
}

export async function resendVerificationByEmail(page: Page, email: string) {
    await page.goto("/admin/users");
    await page.getByPlaceholder("Search users...").fill(email);
    await page.keyboard.press("Enter");
    await openRowActions(page, email);
    await clickVisibleRowMenuItem(page, "Resend Verification Email");
    await expect(page.getByText("Email Sent", { exact: true })).toBeVisible();
}

export async function promoteUserToAdminByEmail(page: Page, email: string) {
    await page.goto("/admin/users");
    await page.getByPlaceholder("Search users...").fill(email);
    await page.keyboard.press("Enter");
    await openRowActions(page, email);
    await clickVisibleRowMenuItem(page, "Promote to Admin");
    await expect(page.getByText("Role Updated")).toBeVisible();
}

export async function openOrgBillingAccountsFromImpersonation(page: Page) {
    await page.goto("/");
    await expect(page).toHaveURL(/\/org\/[^/]+\//);

    const match = page.url().match(/\/org\/([^/]+)\//);
    if (!match) {
        throw new Error("Unable to resolve active organization slug while impersonating");
    }

    const slug = match[1];
    await page.goto(`/org/${slug}/admin/billing/accounts`);
    await expect(page.getByText("Billing Accounts")).toBeVisible();
}

export async function activateCurrencyIfNeeded(page: Page, currencyCode: "CNY" | "ETD") {
    const card = page.locator(
        `xpath=//strong[normalize-space(text())='${currencyCode}']/ancestor::*[contains(@class,'ant-card')][1]`
    );
    await expect(card).toBeVisible();

    const actionButton = card.getByRole("button", { name: /Active|Activate Wallet/ }).first();
    await expect(actionButton).toBeVisible();

    const label = (await actionButton.innerText()).trim();
    if (label.includes("Activate Wallet")) {
        await actionButton.click();
    }

    await expect(card.getByRole("button", { name: /Active/ })).toBeVisible();
}

async function ensureFundingAccountIfMissing(page: Page, drawer: Locator) {
    const createButton = drawer.getByRole("button", { name: "Create Funding Account" });
    if ((await createButton.count()) > 0) {
        await createButton.click();
        const confirmCreate = page.locator(".ant-popover:visible").getByRole("button", {
            name: "Create",
        });
        if ((await confirmCreate.count()) > 0) {
            await confirmCreate.click();
        }
        await expect(
            drawer
                .getByText("Org Funding:")
                .or(drawer.getByRole("button", { name: "Fund Organization" }))
        ).toBeVisible({ timeout: 15000 });
    }
}

export async function creditOrganizationFromSuperAdmin(
    page: Page,
    input: { organizationName: string; currencyCode: "CNY" | "ETD"; amount: string }
) {
    await page.goto("/admin/billing");
    await page.getByRole("button", { name: "Org Funding" }).click();

    const drawer = page
        .locator(".ant-drawer")
        .filter({ hasText: "Admin Ledger Adjustment" })
        .last();
    await expect(drawer).toBeVisible();

    // Organization select
    const orgSelect = drawer.locator(".ant-select").first();
    await expect(orgSelect).toBeVisible();
    await orgSelect.click();
    await page.waitForSelector(".ant-select-dropdown:not(.ant-select-dropdown-hidden)", {
        state: "visible",
    });
    const orgDropdown = page.locator(".ant-select-dropdown:visible").last();
    await orgDropdown.getByTitle(input.organizationName, { exact: true }).click();
    await page.waitForSelector(".ant-select-dropdown", { state: "hidden" });
    await expect(drawer.getByText("Select an organization above")).toBeHidden();

    await ensureFundingAccountIfMissing(page, drawer);
    await expect(
        drawer.getByText(new RegExp(`No ${input.currencyCode} funding account`))
    ).toBeHidden();

    // Currency select
    const currencySelect = drawer.locator(".ant-select").nth(1);
    await expect(currencySelect).toBeVisible();
    await currencySelect.click();
    await page.waitForSelector(".ant-select-dropdown:not(.ant-select-dropdown-hidden)", {
        state: "visible",
    });
    const currencyDropdown = page.locator(".ant-select-dropdown:visible").last();
    await currencyDropdown.getByTitle(input.currencyCode, { exact: true }).click();
    await page.waitForSelector(".ant-select-dropdown", { state: "hidden" });

    // Amount input
    const amountFormItem = drawer.locator(".ant-form-item").filter({ hasText: "Amount" });
    const amountInput = amountFormItem.locator("input").first();
    await expect(amountInput).toBeVisible();
    await amountInput.click();
    await amountInput.press("Meta+a");
    await amountInput.press("Backspace");
    const digits = input.amount.replace(/\D/g, "");
    for (const digit of digits) {
        await amountInput.press(digit);
    }

    await drawer.getByRole("button", { name: "Fund Organization" }).click();
    await expect(drawer).not.toHaveClass(/ant-drawer-open/, { timeout: 15000 });
}

export async function logoutViaApi(page: Page) {
    await page.request.post("/api/v1/auth/sign-out");
    await page.context().clearCookies();
    await page.goto("/auth/sign-in");
    await expect(page).toHaveURL(/\/auth\/sign-in/);
}
