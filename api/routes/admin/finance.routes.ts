import {
    HttpMethods,
    HttpStatusCodes,
    jsonContent,
    jsonContentRequired,
} from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { createRoute } from "@hono/zod-openapi";
import { executeTransferResponseSchema, listFinancialAccountsResponseSchema } from "@shared";
import { z } from "zod";

const tags = ["Admin - Finance"];

const adminCreditSchema = z.object({
    categoryId: z.string().min(1),
    platformTreasuryAccountId: z.string().min(1),
    destinationAccountId: z.string().min(1),
    currencyId: z.string().min(1),
    amountCents: z.number().int().positive(),
    description: z.string().optional(),
});

const adminDebitSchema = z.object({
    categoryId: z.string().min(1),
    sourceAccountId: z.string().min(1),
    platformTreasuryAccountId: z.string().min(1),
    currencyId: z.string().min(1),
    amountCents: z.number().int().positive(),
    description: z.string().optional(),
});

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
        middleware: [requireAuth, requireSuperAdmin] as const,
        summary: "Super admin: platform-initiated credit to an account",
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(adminCreditSchema, "Credit details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                executeTransferResponseSchema,
                "Credit executed successfully"
            ),
        },
    }),

    adminDebit: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/admin/finance/orgs/{organizationId}/debit",
        middleware: [requireAuth, requireSuperAdmin] as const,
        summary: "Super admin: platform-initiated debit from an account",
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(adminDebitSchema, "Debit details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                executeTransferResponseSchema,
                "Debit executed successfully"
            ),
        },
    }),
};
