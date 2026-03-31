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

export const FinanceRoutes = {
    tags,

    getBalance: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/finance/summary",
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
        path: "/orgs/{organizationId}/finance/transactions",
        summary: "Get paginated transaction history for the organization with filters",
        request: {
            params: z.object({ organizationId: z.string() }),
            query: z.object({
                page: z.coerce.number().min(1).default(1),
                pageSize: z.coerce.number().min(1).max(100).default(20),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                minAmount: z.coerce.number().optional(),
                maxAmount: z.coerce.number().optional(),
                txId: z.string().optional(),
                accountId: z.string().optional(),
                status: z.enum(["pending", "completed", "reversed"]).optional(),
                categoryId: z.string().optional(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                transactionHistoryResponseSchema,
                "Transactions fetched successfully"
            ),
        },
    }),

    reverseTransaction: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/finance/transactions/{txId}/reverse",
        summary: "Reverse a transaction by creating a mirror reversal",
        request: {
            params: z.object({
                organizationId: z.string(),
                txId: z.string(),
            }),
            body: jsonContentRequired(z.object({ reason: z.string().min(1) }), "Reversal reason"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                executeTransferResponseSchema,
                "Reversal transaction created"
            ),
        },
    }),

    executeTransfer: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/finance/transfer",
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

    createAccount: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/finance/accounts",
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
            [HttpStatusCodes.CONFLICT]: jsonContent(
                z.object({ message: z.string() }),
                "Account already exists"
            ),
            [HttpStatusCodes.BAD_REQUEST]: jsonContent(
                z.object({ message: z.string() }),
                "Invalid request"
            ),
        },
    }),

    listAccounts: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/finance/accounts",
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
        path: "/orgs/{organizationId}/finance/accounts/{accountId}/deactivate",
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

    initializeUserWallet: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/members/{userId}/initialize-wallet",
        summary: "Manually provision default accounts for a member (idempotent)",
        request: {
            params: z.object({
                organizationId: z.string(),
                userId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({
                    success: z.boolean(),
                    results: z.array(z.any()),
                }),
                "Wallet initialization completed"
            ),
        },
    }),
};
