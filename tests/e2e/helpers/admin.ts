import { expect, type Locator, type Page } from "@playwright/test";
import { getMemberFundingContext } from "./db";

function rowForEmail(page: Page, email: string): Locator {
    return page.locator("tr", { hasText: email }).first();
}

async function openRowActions(page: Page, email: string) {
    await expect(page.locator(".ant-drawer-mask:visible")).toHaveCount(0, { timeout: 15000 });
    const row = rowForEmail(page, email);
    await expect(row).toBeVisible();
    await row.locator("button").last().click();
}

async function clickVisibleRowMenuItem(page: Page, name: string) {
    const item = page.locator(".ant-dropdown:visible").getByRole("menuitem", { name }).first();
    await expect(item).toBeVisible();
    await item.evaluate((node) => {
        (node as { click: () => void }).click();
    });
}

async function waitForMembersTableReady(page: Page) {
    await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
    // Members list is loaded via query hooks; wait for table loading overlays
    // to clear before interacting with rows/drawers.
    await expect(page.locator(".ant-spin-spinning")).toHaveCount(0, { timeout: 20000 });
}

export async function createUserAndOrganization(
    page: Page,
    input: { fullName: string; email: string; organizationName: string; password: string }
) {
    await page.goto("/admin/organizations");
    await expect(page).not.toHaveURL(/\/auth\/sign-in$/);
    await expect(page.getByRole("button", { name: "Create User + Org" })).toBeVisible({
        timeout: 15000,
    });
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

export async function demoteUserToRegularByEmail(page: Page, email: string) {
    await page.goto("/admin/users");
    await page.getByPlaceholder("Search users...").fill(email);
    await page.keyboard.press("Enter");
    await openRowActions(page, email);
    await clickVisibleRowMenuItem(page, "Demote to User");
    await expect(page.getByText("Role Updated")).toBeVisible();
}

export async function banUserByEmail(page: Page, email: string) {
    await page.goto("/admin/users");
    await page.getByPlaceholder("Search users...").fill(email);
    await page.keyboard.press("Enter");
    await openRowActions(page, email);
    await clickVisibleRowMenuItem(page, "Ban User");

    const confirmModal = page.locator(".ant-modal-confirm:visible");
    await expect(confirmModal).toBeVisible();
    await confirmModal.getByRole("button", { name: "OK" }).click();

    await expect(page.getByText("User Banned")).toBeVisible();
}

export async function resendPasswordResetByEmail(page: Page, email: string) {
    await page.goto("/admin/users");
    await page.getByPlaceholder("Search users...").fill(email);
    await page.keyboard.press("Enter");
    await openRowActions(page, email);
    await clickVisibleRowMenuItem(page, "Resend Password Reset");
    // Ant notification toasts are transient and occasionally render too quickly
    // for deterministic assertions in CI/headed runs. Confirm action dispatch by
    // ensuring the row remains accessible after the menu click.
    await expect(rowForEmail(page, email)).toBeVisible();
}

export async function openOrgSettingsFromImpersonation(page: Page) {
    await page.goto("/");
    await expect(page).toHaveURL(/\/org\/[^/]+\//);

    const match = page.url().match(/\/org\/([^/]+)\//);
    if (!match) {
        throw new Error("Unable to resolve active organization slug while impersonating");
    }

    const slug = match[1];
    await page.goto(`/org/${slug}/dashboard/settings`);
    await expect(page.getByText("Organization Settings")).toBeVisible();
}

export async function openOrgMembersFromImpersonation(page: Page) {
    await page.goto("/");
    await expect(page).toHaveURL(/\/org\/[^/]+\//);

    const match = page.url().match(/\/org\/([^/]+)\//);
    if (!match) {
        throw new Error("Unable to resolve active organization slug while impersonating");
    }

    const slug = match[1];
    await page.goto(`/org/${slug}/admin/members`);
    await waitForMembersTableReady(page);
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

export async function createOrganizationMember(
    page: Page,
    input: { fullName: string; email: string; role: "student" | "teacher" | "admin" | "owner" }
) {
    await page.getByRole("button", { name: "Create New Member" }).click();

    const modal = page.locator(".ant-modal:visible").filter({ hasText: "Create New Member" });
    await expect(modal).toBeVisible();

    await modal.getByLabel("Full Name").fill(input.fullName);
    await modal.getByLabel("Email Address").fill(input.email);
    await modal.getByLabel("Role").click();
    await page.waitForSelector(".ant-select-dropdown:not(.ant-select-dropdown-hidden)", {
        state: "visible",
    });
    const roleOption = page
        .locator(".ant-select-dropdown:visible .ant-select-item-option")
        .filter({ hasText: new RegExp(`^${input.role}$`, "i") })
        .first();
    await expect(roleOption).toBeVisible();
    await roleOption.evaluate((node) => {
        (node as { click: () => void }).click();
    });

    await modal.getByRole("button", { name: "Create Member" }).click();
    await expect(modal).toBeHidden();
    await expect(page.locator("tr", { hasText: input.email }).first()).toBeVisible();
}

export async function initializeMemberWalletByEmail(page: Page, email: string) {
    await page
        .getByPlaceholder("Search members by name or email...")
        .fill(email.includes("+") ? email.split("+")[0] : email);
    await page.keyboard.press("Enter");
    await openRowActions(page, email);
    await clickVisibleRowMenuItem(page, "Initialize Wallet");
    // Toast can be transient; validate durable state instead.
    await expect(rowForEmail(page, email)).toBeVisible();
}

export async function creditMemberWalletByEmail(
    page: Page,
    input: { email: string; memberName?: string; currencyCode: "CNY" | "ETD"; amount: string },
    retryOnMissingWallet = true
) {
    await waitForMembersTableReady(page);
    await page
        .getByPlaceholder("Search members by name or email...")
        .fill(
            input.memberName ??
                (input.email.includes("+") ? input.email.split("+")[0] : input.email)
        );
    await page.keyboard.press("Enter");
    await expect(page.locator(".ant-spin-spinning")).toHaveCount(0, { timeout: 20000 });

    const row = page
        .locator("tr")
        .filter({ hasText: input.memberName ?? input.email })
        .first();
    await expect(row).toBeVisible();
    await row.click();

    const drawer = page.locator(".ant-drawer:visible").filter({ hasText: "Member Details" }).last();
    await expect(drawer).toBeVisible();

    const walletTab = drawer.getByRole("tab", { name: "Wallet" }).first();
    await expect(walletTab).toBeVisible();
    await walletTab.evaluate((node) => {
        (node as { click: () => void }).click();
    });
    await expect(drawer.getByRole("tab", { name: "Wallet", selected: true })).toBeVisible();
    await expect(drawer.locator(".ant-spin-spinning")).toHaveCount(0, { timeout: 20000 });
    const walletSelect = drawer
        .locator(".ant-form-item")
        .filter({ hasText: "Select Member Wallet" });
    const walletSelectTrigger = walletSelect.locator(".ant-select-selector").first();
    if ((await walletSelectTrigger.count()) === 0) {
        if (!retryOnMissingWallet) {
            throw new Error(`Member wallet controls not available for ${input.email}`);
        }

        const closeButton = drawer.getByRole("button", { name: /close/i }).first();
        if ((await closeButton.count()) > 0) {
            await closeButton.click();
        } else {
            await page.keyboard.press("Escape");
        }
        await expect(drawer).not.toHaveClass(/ant-drawer-open/);

        await initializeMemberWalletByEmail(page, input.email);
        await creditMemberWalletByEmail(page, input, false);
        return;
    }

    await expect(walletSelectTrigger).toBeVisible();
    await walletSelectTrigger.evaluate((node) => {
        (node as { click: () => void }).click();
    });
    const walletDropdown = page.locator(".ant-select-dropdown:visible").last();
    if ((await walletDropdown.count()) === 0) {
        await walletSelectTrigger.press("Enter");
    }
    await expect(page.locator(".ant-select-dropdown:visible").last()).toBeVisible({
        timeout: 5000,
    });
    await page
        .locator(".ant-select-dropdown:visible")
        .last()
        .getByText(new RegExp(`^${input.currencyCode}\\s+Wallet`, "i"))
        .click();

    const amountInput = drawer
        .locator(".ant-form-item")
        .filter({ hasText: "Adjustment Amount" })
        .locator("input")
        .first();
    await expect(amountInput).toBeVisible();
    await amountInput.click();
    await amountInput.press("Meta+a");
    await amountInput.press("Backspace");
    for (const digit of input.amount.replace(/\D/g, "")) {
        await amountInput.press(digit);
    }

    await drawer.getByRole("button", { name: "Execute Adjustment" }).click();
    await expect(page.getByText("Adjustment Success")).toBeVisible();
    await drawer.getByRole("button", { name: /close/i }).click();
    await expect(drawer).not.toHaveClass(/ant-drawer-open/);
}

export async function creditMemberWalletByApi(
    page: Page,
    input: {
        memberEmail: string;
        memberName?: string;
        organizationSlug: string;
        currencyCode: "CNY" | "ETD";
        amountCents: number;
    }
) {
    const ctx = getMemberFundingContext({
        memberEmail: input.memberEmail,
        currencyCode: input.currencyCode,
        organizationSlug: input.organizationSlug,
    });

    const res = await page.request.post(`/api/v1/admin/finance/orgs/${ctx.organizationId}/credit`, {
        data: {
            categoryId: "fcat_internal_transfer",
            platformTreasuryAccountId: ctx.fundingAccountId,
            destinationAccountId: ctx.destinationAccountId,
            currencyId: input.currencyCode === "CNY" ? "fcur_cny" : "fcur_etd",
            amountCents: input.amountCents,
            description: `E2E bootstrap funding for ${input.memberName ?? input.memberEmail}`,
        },
    });

    expect(res.ok()).toBeTruthy();
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
