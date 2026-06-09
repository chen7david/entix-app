import { expect, test } from "@playwright/test";
import {
    activateCurrencyIfNeeded,
    banUserByEmail,
    createOrganizationMember,
    createUserAndOrganization,
    creditMemberWalletByApi,
    creditOrganizationFromSuperAdmin,
    demoteUserToRegularByEmail,
    impersonateUserByEmail,
    initializeMemberWalletByEmail,
    logoutViaApi,
    openOrgMembersFromImpersonation,
    openOrgSettingsFromImpersonation,
    promoteUserToAdminByEmail,
    resendPasswordResetByEmail,
    stopImpersonating,
} from "./helpers/admin";
import { loginAsRootAdmin } from "./helpers/auth";
import { markUserEmailVerified } from "./helpers/db";

test.describe("Environment bootstrap flow", () => {
    test.setTimeout(240_000);

    test("sets up org, wallets, users, and admin state", async ({ page }) => {
        const PRIMARY_USER = {
            fullName: "David Chen",
            email: "chen7david@gmail.com",
            organizationName: "Entix Academy",
            password: "password",
        } as const;
        const STUDENT = {
            fullName: "Test Student",
            email: "chen7david+student@gmail.com",
            role: "student",
        } as const;
        const TEACHER = {
            fullName: "Test Teacher",
            email: "chen7david+teacher@gmail.com",
            role: "teacher",
        } as const;

        await test.step("Login root, create org+user, send password reset", async () => {
            await loginAsRootAdmin(page);
            await createUserAndOrganization(page, PRIMARY_USER);
            await resendPasswordResetByEmail(page, PRIMARY_USER.email);
            markUserEmailVerified(PRIMARY_USER.email);
        });

        await test.step("Impersonate David, activate org wallets, create members", async () => {
            await impersonateUserByEmail(page, PRIMARY_USER.email);
            await openOrgSettingsFromImpersonation(page);
            await activateCurrencyIfNeeded(page, "CNY");
            await activateCurrencyIfNeeded(page, "ETD");

            await openOrgMembersFromImpersonation(page);
            await createOrganizationMember(page, STUDENT);
            await createOrganizationMember(page, TEACHER);
            await initializeMemberWalletByEmail(page, STUDENT.email);
            await stopImpersonating(page);
        });

        await test.step("Fund org and promote David to global admin", async () => {
            await creditOrganizationFromSuperAdmin(page, {
                organizationName: PRIMARY_USER.organizationName,
                currencyCode: "CNY",
                amount: "10000000",
            });
            await creditOrganizationFromSuperAdmin(page, {
                organizationName: PRIMARY_USER.organizationName,
                currencyCode: "ETD",
                amount: "1000000",
            });
            await promoteUserToAdminByEmail(page, PRIMARY_USER.email);
        });

        await test.step("Logout root, login David, fund student wallets", async () => {
            await logoutViaApi(page);
            await page.goto("/auth/sign-in");
            await page.getByPlaceholder("Email").fill(PRIMARY_USER.email);
            await page.getByPlaceholder("Password").fill(PRIMARY_USER.password);
            await page.getByRole("button", { name: "Sign In" }).click();
            await expect(page).not.toHaveURL(/\/auth\/sign-in$/);

            await page.goto("/");
            await expect(page).toHaveURL(/\/org\/[^/]+\//);
            const match = page.url().match(/\/org\/([^/]+)\//);
            if (!match) {
                throw new Error("Unable to resolve active organization slug for David Chen");
            }
            const orgSlug = match[1];
            await creditMemberWalletByApi(page, {
                memberEmail: STUDENT.email,
                memberName: STUDENT.fullName,
                organizationSlug: orgSlug,
                currencyCode: "CNY",
                amountCents: 300000,
            });
            await creditMemberWalletByApi(page, {
                memberEmail: STUDENT.email,
                memberName: STUDENT.fullName,
                organizationSlug: orgSlug,
                currencyCode: "ETD",
                amountCents: 100000,
            });
        });

        await test.step("Go global, demote and ban root", async () => {
            await demoteUserToRegularByEmail(page, "root@admin.com");
            await banUserByEmail(page, "root@admin.com");
        });
    });
});
