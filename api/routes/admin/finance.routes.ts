import {
    HttpMethods,
    HttpStatusCodes,
    jsonContent,
    jsonContentRequired,
} from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { idempotencyMiddleware } from "@api/middleware/idempotency.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import {
    adminCreditRequestSchema,
    adminDebitRequestSchema,
    listFinancialAccountsResponseSchema,
    transactionResultSchema,
    walletAccountDTOSchema,
} from "@shared";
import { successResponseSchema } from "@shared/schemas/dto/base.dto";

const tags = ["Admin - Finance"];

export const AdminFinanceRoutes = {
    tags,

    getTreasuryBalance: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/admin/finance/treasury/balance",
        middleware: [requireAuth, requireSuperAdmin] as const,
        summary: "Super admin: get all platform treasury account balances",
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                listFinancialAccountsResponseSchema,
                "Treasury balances fetched successfully"
            ),
        },
    }),

    getAllManagedAccounts: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/admin/finance/accounts/managed",
        middleware: [requireAuth, requireSuperAdmin] as const,
        summary: "Super admin: get all organization-owned accounts",
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                listFinancialAccountsResponseSchema,
                "Managed accounts fetched successfully"
            ),
        },
    }),
    getOrgAccounts: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/admin/finance/orgs/{organizationId}/accounts",
        middleware: [requireAuth, requireSuperAdmin] as const,
        summary: "Super admin: get all accounts for any organization",
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                listFinancialAccountsResponseSchema,
                "Organization accounts fetched successfully"
            ),
        },
    }),

    adminCredit: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/admin/finance/orgs/{organizationId}/credit",
        middleware: [requireAuth, requireSuperAdmin, idempotencyMiddleware] as const,
        summary: "Super admin: platform-initiated credit to an account",
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(adminCreditRequestSchema, "Credit details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                z.object({ data: transactionResultSchema }),
                "Credit executed successfully"
            ),
        },
    }),

    adminDebit: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/admin/finance/orgs/{organizationId}/debit",
        middleware: [requireAuth, requireSuperAdmin, idempotencyMiddleware] as const,
        summary: "Super admin: platform-initiated debit from an account",
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(adminDebitRequestSchema, "Debit details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                z.object({ data: transactionResultSchema }),
                "Debit executed successfully"
            ),
        },
    }),
    ensureOrgFundingAccount: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/admin/finance/orgs/{organizationId}/currencies/{currencyId}/ensure-funding",
        middleware: [requireAuth, requireSuperAdmin] as const,
        summary: "Super admin: ensure an org has a funding account for a currency",
        request: {
            params: z.object({ organizationId: z.string(), currencyId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({ data: walletAccountDTOSchema }),
                "Funding account exists or was created successfully"
            ),
        },
    }),
    updateAccount: createRoute({
        tags,
        method: HttpMethods.PATCH,
        path: "/admin/finance/accounts/{id}",
        middleware: [requireAuth, requireSuperAdmin] as const,
        summary: "Super admin: update account label and/or overdraft limit",
        request: {
            params: z.object({ id: z.string() }),
            body: jsonContentRequired(
                z.object({
                    name: z.string().min(1).optional(),
                    overdraftLimitCents: z.number().int().min(0).nullable().optional(),
                }),
                "Update details"
            ),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({ data: walletAccountDTOSchema }),
                "Account updated successfully"
            ),
        },
    }),
    archiveAccount: createRoute({
        tags,
        method: HttpMethods.PATCH,
        path: "/admin/finance/accounts/{id}/archive",
        middleware: [requireAuth, requireSuperAdmin] as const,
        summary: "Super admin: archive account (soft delete)",
        request: {
            params: z.object({ id: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                successResponseSchema,
                "Account archived successfully"
            ),
            [HttpStatusCodes.BAD_REQUEST]: jsonContent(
                z.object({ error: z.string() }),
                "Invalid archiving request (e.g. non-zero balance)"
            ),
        },
    }),
};
