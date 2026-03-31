import {
    HttpMethods,
    HttpStatusCodes,
    jsonContent,
    jsonContentRequired,
} from "@api/helpers/http.helpers";
import { createRoute } from "@hono/zod-openapi";
import {
    createFinancialAccountResponseSchema,
    createFinancialAccountSchema,
    currencyListWithStatusResponseSchema,
    executeTransferResponseSchema,
    listFinancialAccountsResponseSchema,
    transactionHistoryResponseSchema,
    walletSummaryResponseSchema,
} from "@shared";
import { z } from "zod";

const tags = ["Wallet"];

const transferSchema = z.object({
    categoryId: z.string().min(1),
    sourceAccountId: z.string().min(1),
    destinationAccountId: z.string().min(1),
    currencyId: z.string().min(1),
    amountCents: z.number().int().positive(),
    description: z.string().optional(),
});

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

export const WalletRoutes = {
    tags,

    getBalance: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/wallet/balance",
        summary: "Get organization wallet balance summary",
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                walletSummaryResponseSchema,
                "Wallet balance fetched successfully"
            ),
        },
    }),

    getTransactions: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/wallet/transactions",
        summary: "Get paginated transaction history for the organization",
        request: {
            params: z.object({ organizationId: z.string() }),
            query: z.object({
                page: z
                    .string()
                    .optional()
                    .transform((v) => (v ? parseInt(v) : 1)),
                pageSize: z
                    .string()
                    .optional()
                    .transform((v) => (v ? parseInt(v) : 20)),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                transactionHistoryResponseSchema,
                "Transactions fetched successfully"
            ),
        },
    }),

    executeTransfer: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/wallet/transfer",
        summary: "Execute an internal transfer between accounts",
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(transferSchema, "Transfer details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                executeTransferResponseSchema,
                "Transfer executed successfully"
            ),
        },
    }),

    adminCredit: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/wallet/admin/credit",
        summary: "Platform-initiated credit to an account",
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(adminCreditSchema, "Credit details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                executeTransferResponseSchema, // Using same txId response
                "Credit executed successfully"
            ),
        },
    }),

    adminDebit: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/wallet/admin/debit",
        summary: "Platform-initiated debit from an account",
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

    createAccount: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/wallet/accounts",
        summary: "Create a new financial account for the organization",
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(createFinancialAccountSchema, "Account creation details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                createFinancialAccountResponseSchema,
                "Account created successfully"
            ),
        },
    }),

    listAccounts: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/wallet/accounts",
        summary: "List all active financial accounts for the organization",
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                listFinancialAccountsResponseSchema,
                "Accounts fetched successfully"
            ),
        },
    }),

    deactivateAccount: createRoute({
        tags,
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/wallet/accounts/{accountId}/deactivate",
        summary: "Deactivate a financial account (blocks future transactions)",
        request: {
            params: z.object({
                organizationId: z.string(),
                accountId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                createFinancialAccountResponseSchema,
                "Account deactivated successfully"
            ),
        },
    }),

    adminGetOrgAccounts: createRoute({
        tags: ["Wallet", "Admin"],
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/wallet/accounts/admin",
        summary: "Super admin: get all accounts for any org including balances",
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                listFinancialAccountsResponseSchema,
                "Accounts fetched"
            ),
        },
    }),

    adminGetTreasuryBalance: createRoute({
        tags: ["Wallet", "Admin"],
        method: HttpMethods.GET,
        path: "/wallet/treasury/balance",
        summary: "Super admin: get platform treasury account balance",
        request: {},
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({
                    balanceCents: z.number(),
                    balanceFormatted: z.string(),
                }),
                "Treasury balance"
            ),
        },
    }),

    getOrgCurrencyStatus: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/finance/currencies",
        summary: "Get all platform currencies with activation status for this org",
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                currencyListWithStatusResponseSchema,
                "Currency status fetched"
            ),
        },
    }),

    activateCurrency: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/finance/currencies/activate",
        summary: "Activate a currency for this org by creating a General Fund account",
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(
                z.object({ currencyId: z.string().min(1) }),
                "Currency to activate"
            ),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                createFinancialAccountResponseSchema,
                "Currency activated — General Fund account created"
            ),
        },
    }),
};
