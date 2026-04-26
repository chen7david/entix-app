import { test } from "@playwright/test";
import {
    activateCurrencyIfNeeded,
    createUserAndOrganization,
    creditOrganizationFromSuperAdmin,
    impersonateUserByEmail,
    logoutViaApi,
    openOrgBillingAccountsFromImpersonation,
    promoteUserToAdminByEmail,
    resendVerificationByEmail,
    stopImpersonating,
} from "./helpers/admin";
import { loginAsRootAdmin } from "./helpers/auth";

const NEW_USER = {
    fullName: "David Chen",
    email: "chen7david@gmail.com",
    organizationName: "Entix Academy",
    password: "TempPass123!",
};

test.describe("Root admin orchestration flow", () => {
    test("completes organization bootstrap, impersonation, promotion, and funding", async ({
        page,
    }) => {
        await test.step("Login as root admin", async () => {
            await loginAsRootAdmin(page);
        });

        await test.step("Create Entix Academy + David Chen user", async () => {
            await createUserAndOrganization(page, NEW_USER);
        });

        await test.step("Impersonate new user and activate CNY + ETD wallets", async () => {
            await impersonateUserByEmail(page, NEW_USER.email);
            await openOrgBillingAccountsFromImpersonation(page);
            await activateCurrencyIfNeeded(page, "CNY");
            await activateCurrencyIfNeeded(page, "ETD");
        });

        await test.step("Stop impersonation and return to super admin area", async () => {
            await stopImpersonating(page);
        });

        await test.step("Resend verification email and promote user to admin", async () => {
            await resendVerificationByEmail(page, NEW_USER.email);
            await promoteUserToAdminByEmail(page, NEW_USER.email);
        });

        await test.step("Fund Entix Academy CNY and ETD accounts", async () => {
            await creditOrganizationFromSuperAdmin(page, {
                organizationName: NEW_USER.organizationName,
                currencyCode: "CNY",
                amount: "100000",
            });
            await creditOrganizationFromSuperAdmin(page, {
                organizationName: NEW_USER.organizationName,
                currencyCode: "ETD",
                amount: "10000",
            });
        });

        await test.step("Logout", async () => {
            await logoutViaApi(page);
        });
    });
});
