import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { createRoute } from "@hono/zod-openapi";
import {
    paginationSchema,
    transactionHistoryResponseSchema,
    walletSummaryDTOSchema,
} from "@shared/schemas/dto/financial.dto";
import { z } from "zod";

const tags = ["Personal Wallet (Org-Scoped)"];

export const MemberWalletRoutes = {
    tags,

    getSummary: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/members/{userId}/wallet/summary",
        tags,
        summary: "Get personal user wallet summary within an organization",
        request: {
            params: z.object({
                organizationId: z.string().openapi({ description: "Organization ID" }),
                userId: z.string().openapi({ description: "User ID" }),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({ data: walletSummaryDTOSchema }),
                "Personal wallet summary fetched successfully"
            ),
            [HttpStatusCodes.FORBIDDEN]: jsonContent(
                z.object({ message: z.string() }),
                "Access denied"
            ),
        },
    }),

    getTransactions: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/members/{userId}/wallet/transactions",
        tags,
        summary: "Get paginated personal transaction history within an organization",
        request: {
            params: z.object({
                organizationId: z.string().openapi({ description: "Organization ID" }),
                userId: z.string().openapi({ description: "User ID" }),
            }),
            query: paginationSchema,
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                transactionHistoryResponseSchema,
                "Personal transaction history fetched"
            ),
            [HttpStatusCodes.FORBIDDEN]: jsonContent(
                z.object({ message: z.string() }),
                "Access denied"
            ),
        },
    }),

    initializeWallet: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/members/{userId}/wallet/initialize",
        tags,
        summary: "Initialize default wallets for a member within an organization",
        request: {
            params: z.object({
                organizationId: z.string().openapi({ description: "Organization ID" }),
                userId: z.string().openapi({ description: "User ID" }),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({ success: z.boolean(), message: z.string() }),
                "Wallets initialized successfully"
            ),
            [HttpStatusCodes.FORBIDDEN]: jsonContent(
                z.object({ message: z.string() }),
                "Access denied"
            ),
        },
    }),
};
