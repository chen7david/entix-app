import { z } from "@hono/zod-openapi";

export const walletAccountDTOSchema = z.object({
    id: z.string(),
    ownerId: z.string(),
    ownerType: z.enum(["user", "org"]),
    currencyId: z.string(),
    name: z.string(),
    balanceCents: z.number(),
    isActive: z.boolean(),
    isFundingAccount: z.boolean(), // Matches DB schema (required)
    archivedAt: z.union([z.string(), z.date()]).nullable(),
    createdAt: z.union([z.string(), z.date()]),
    updatedAt: z.union([z.string(), z.date()]),
});

export type WalletAccountDTO = z.infer<typeof walletAccountDTOSchema>;

export const walletSummaryDTOSchema = z.object({
    accounts: z.array(walletAccountDTOSchema),
});

export type WalletSummaryDTO = z.infer<typeof walletSummaryDTOSchema>;

export const financialTransactionSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    categoryId: z.string(),
    sourceAccountId: z.string(),
    destinationAccountId: z.string(),
    currencyId: z.string(),
    amountCents: z.number(),
    status: z.enum(["pending", "completed", "reversed"]),
    description: z.string().nullable(),
    transactionDate: z.string().or(z.date()),
    createdAt: z.string().or(z.date()),
});

export const transactionCursorSchema = z.object({
    date: z.string().or(z.date()),
    id: z.string(),
});

export type TransactionCursor = z.infer<typeof transactionCursorSchema>;

export const transactionHistoryResponseSchema = z.object({
    data: z.array(financialTransactionSchema),
    nextCursor: z.string().nullable(),
});

export const executeTransferResponseSchema = z.object({
    txId: z.string(),
});

export const createFinancialAccountSchema = z.object({
    name: z.string().min(1).max(100),
    currencyId: z.string().min(1),
    ownerType: z.enum(["user", "org"]),
    ownerId: z.string().min(1),
});

export const createFinancialAccountResponseSchema = walletAccountDTOSchema;

export const listFinancialAccountsResponseSchema = z.object({
    data: z.array(walletAccountDTOSchema),
});

export const currencyWithStatusSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    symbol: z.string(),
    isActivated: z.boolean(),
    accountId: z.string().nullable(),
    balanceCents: z.number().nullable(),
});

export const currencyListWithStatusResponseSchema = z.object({
    data: z.array(currencyWithStatusSchema),
});

// --- Request Schemas (Shared for Frontend Form Validation) ---

export const adminCreditRequestSchema = z.object({
    categoryId: z.string().min(1),
    platformTreasuryAccountId: z.string().min(1),
    destinationAccountId: z.string().min(1),
    currencyId: z.string().min(1),
    amountCents: z.number().int().positive(),
    description: z.string().optional(),
});

export const adminDebitRequestSchema = z.object({
    categoryId: z.string().min(1),
    sourceAccountId: z.string().min(1),
    platformTreasuryAccountId: z.string().min(1),
    currencyId: z.string().min(1),
    amountCents: z.number().int().positive(),
    description: z.string().optional(),
});

export const executeTransferRequestSchema = z.object({
    categoryId: z.string().min(1),
    sourceAccountId: z.string().min(1),
    destinationAccountId: z.string().min(1),
    currencyId: z.string().min(1),
    amountCents: z.number().int().positive(),
    description: z.string().optional(),
});

export const reverseTransactionRequestSchema = z.object({
    reason: z.string().min(3).max(255),
});

export const activateCurrencyRequestSchema = z.object({
    currencyId: z.string().min(1),
});

// --- Result Schemas (Payloads Only, No Envelopes per Rule 23/25) ---

export const transactionResultSchema = z.object({
    txId: z.string(),
});

export const paginationSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const transactionFiltersSchema = paginationSchema.extend({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    minAmount: z.coerce.number().optional(),
    maxAmount: z.coerce.number().optional(),
    txId: z.string().optional(),
    accountId: z.string().optional(),
    status: z.enum(["pending", "completed", "reversed"]).optional(),
    categoryId: z.string().optional(),
});

export const ensureFundingAccountRequestSchema = z.object({
    organizationId: z.string().min(1),
    currencyId: z.string().min(1),
});

export type AdminCreditRequest = z.infer<typeof adminCreditRequestSchema>;
export type AdminDebitRequest = z.infer<typeof adminDebitRequestSchema>;
export type EnsureFundingAccountRequest = z.infer<typeof ensureFundingAccountRequestSchema>;
export type ExecuteTransferRequest = z.infer<typeof executeTransferRequestSchema>;
export type ReverseTransactionRequest = z.infer<typeof reverseTransactionRequestSchema>;
export type ActivateCurrencyRequest = z.infer<typeof activateCurrencyRequestSchema>;
export type TransactionResult = z.infer<typeof transactionResultSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
