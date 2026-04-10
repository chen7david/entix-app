import {
    HttpMethods,
    HttpStatusCodes,
    jsonContent,
    jsonContentRequired,
} from "@api/helpers/http.helpers";
import { createRoute, z } from "@hono/zod-openapi";
import {
    activateCurrencyRequestSchema,
    assignBillingPlanSchema,
    billingPlanPaginationSchema,
    createBillingPlanSchema,
    createFinancialAccountResponseSchema,
    createFinancialAccountSchema,
    currencyListWithStatusResponseSchema,
    executeTransferRequestSchema,
    listBillingPlansResponseSchema,
    listFinancialAccountsResponseSchema,
    listMemberBillingPlansResponseSchema,
    reverseTransactionRequestSchema,
    transactionFiltersSchema,
    transactionHistoryResponseSchema,
    transactionResultSchema,
    walletSummaryDTOSchema,
} from "@shared";
import { successResponseSchema } from "@shared/schemas/dto/base.dto";

const tags = ["Wallet"];

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
                z.object({ data: walletSummaryDTOSchema }),
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
            query: transactionFiltersSchema,
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
            body: jsonContentRequired(reverseTransactionRequestSchema, "Reversal reason"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                z.object({ data: transactionResultSchema }),
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
            body: jsonContentRequired(executeTransferRequestSchema, "Transfer details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                z.object({ data: transactionResultSchema }),
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
                z.object({ data: createFinancialAccountResponseSchema }),
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
                successResponseSchema,
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
            body: jsonContentRequired(activateCurrencyRequestSchema, "Currency to activate"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                z.object({ data: createFinancialAccountResponseSchema }),
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
                successResponseSchema,
                "Wallet initialization completed"
            ),
        },
    }),
};

/**
 * Billing Plan specific routes.
 */
const billingTags = ["Finance - Billing Plans"];

export const FinanceBillingRoutes = {
    tags: billingTags,

    createPlan: createRoute({
        tags: billingTags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/finance/billing-plans",
        summary: "Create a new organization-level billing plan",
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(createBillingPlanSchema, "Billing plan details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                z.object({ data: z.any() }), // Using any for brevity in routes, handler will be typed
                "Billing plan created successfully"
            ),
        },
    }),

    listOrgPlans: createRoute({
        tags: billingTags,
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/finance/billing-plans",
        summary: "List organization billing plans with pagination",
        request: {
            params: z.object({ organizationId: z.string() }),
            query: billingPlanPaginationSchema,
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                listBillingPlansResponseSchema,
                "Billing plans fetched successfully"
            ),
        },
    }),

    assignMemberPlan: createRoute({
        tags: billingTags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/members/{userId}/billing-plans",
        summary: "Assign a billing plan to a member (student)",
        request: {
            params: z.object({
                organizationId: z.string(),
                userId: z.string(),
            }),
            body: jsonContentRequired(assignBillingPlanSchema, "Plan assignment details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                z.object({ data: z.any() }),
                "Billing plan assigned successfully"
            ),
            [HttpStatusCodes.CONFLICT]: jsonContent(
                z.object({ message: z.string() }),
                "Student already has an active billing plan for this currency"
            ),
        },
    }),

    replaceMemberPlan: createRoute({
        tags: billingTags,
        method: HttpMethods.PUT, // PUT for idempotent replacement
        path: "/orgs/{organizationId}/members/{userId}/billing-plans",
        summary: "Replace a student's billing plan for a currency",
        request: {
            params: z.object({
                organizationId: z.string(),
                userId: z.string(),
            }),
            body: jsonContentRequired(assignBillingPlanSchema, "New plan assignment details"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({ data: z.any() }),
                "Billing plan replaced successfully"
            ),
        },
    }),

    listMemberPlans: createRoute({
        tags: billingTags,
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/members/{userId}/billing-plans",
        summary: "List a member's billing plan assignments",
        request: {
            params: z.object({
                organizationId: z.string(),
                userId: z.string(),
            }),
            query: billingPlanPaginationSchema,
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                listMemberBillingPlansResponseSchema,
                "Member billing plans fetched successfully"
            ),
        },
    }),

    unassignMemberPlan: createRoute({
        tags: billingTags,
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/members/{userId}/billing-plans/{assignmentId}",
        summary: "Remove a student's billing plan assignment",
        request: {
            params: z.object({
                organizationId: z.string(),
                userId: z.string(),
                assignmentId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                successResponseSchema,
                "Billing plan unassigned successfully"
            ),
        },
    }),
};
