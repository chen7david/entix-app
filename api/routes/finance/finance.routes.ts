import { createRoute, z } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent, jsonContentRequired, HttpMethods } from "@api/helpers/http.helpers";
import { financialTransaction, financialPosting, financialAccount } from "@api/db/schema.db";
import { createSelectSchema } from "drizzle-zod";

const transactionSchema = createSelectSchema(financialTransaction);
const transactionWithPostingsSchema = transactionSchema.extend({
    postings: z.array(createSelectSchema(financialPosting).extend({
        account: createSelectSchema(financialAccount)
    }))
});

export const transferRequestSchema = z.object({
    email: z.string().email(),
    amount: z.number().int().positive(),
    currency: z.string().length(3),
    pin: z.string().min(4),
    description: z.string().optional()
});

export const reverseRequestSchema = z.object({
    transactionId: z.string(),
    reason: z.string().min(5)
});

export const setPinRequestSchema = z.object({
    pin: z.string().min(4),
    password: z.string()
});

export class FinanceRoutes {
    static tags = ['Finance'];

    static transfer = createRoute({
        tags: FinanceRoutes.tags,
        method: HttpMethods.POST,
        path: '/finance/transfer',
        request: {
            body: jsonContentRequired(transferRequestSchema, 'Transfer details'),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(transactionSchema, 'Transaction successful'),
            [HttpStatusCodes.BAD_REQUEST]: { description: 'Invalid input or insufficient funds' },
            [HttpStatusCodes.UNAUTHORIZED]: { description: 'Invalid PIN' },
        },
    });

    static getTransactions = createRoute({
        tags: FinanceRoutes.tags,
        method: HttpMethods.GET,
        path: '/finance/transactions',
        request: {
            query: z.object({
                currency: z.string().optional(),
                limit: z.string().optional(), // Query params are strings usually
                cursor: z.string().optional(),
            })
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.array(transactionWithPostingsSchema), 'List of transactions'),
            [HttpStatusCodes.BAD_REQUEST]: { description: 'Invalid input' },
            [HttpStatusCodes.UNAUTHORIZED]: { description: 'Unauthorized' },
        },
    });

    static getBalance = createRoute({
        tags: FinanceRoutes.tags,
        method: HttpMethods.GET,
        path: '/finance/balance',
        request: {
            query: z.object({
                currency: z.string().optional(),
            })
        },
        responses: {
            // We can return an array of balances or a specific one
            [HttpStatusCodes.OK]: jsonContent(z.array(z.object({
                currency: z.string(),
                balance: z.number(),
                code: z.string().nullable().optional()
            })), 'User balances'),
            [HttpStatusCodes.BAD_REQUEST]: { description: 'Missing organization context' },
            [HttpStatusCodes.UNAUTHORIZED]: { description: 'Unauthorized' },
        },
    });

    static reverse = createRoute({
        tags: FinanceRoutes.tags,
        method: HttpMethods.POST,
        path: '/finance/reverse',
        request: {
            body: jsonContentRequired(reverseRequestSchema, 'Reversal details'),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(transactionSchema, 'Reversal successful'),
            [HttpStatusCodes.BAD_REQUEST]: { description: 'Transaction not found or already reversed' },
            [HttpStatusCodes.FORBIDDEN]: { description: 'Insufficient permissions' },
        },
    });

    static setPin = createRoute({
        tags: FinanceRoutes.tags,
        method: HttpMethods.POST,
        path: '/finance/pin',
        request: {
            body: jsonContentRequired(setPinRequestSchema, 'PIN details'),
        },
        responses: {
            [HttpStatusCodes.OK]: { description: 'PIN set successfully' },
            [HttpStatusCodes.UNAUTHORIZED]: { description: 'Unauthorized' },
        },
    });
}
