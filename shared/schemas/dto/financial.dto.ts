import { z } from "zod";

export const financialAccountSchema = z.object({
    id: z.string(),
    ownerId: z.string(),
    ownerType: z.enum(["user", "org"]),
    currencyId: z.string(),
    name: z.string(),
    balanceCents: z.number(),
    isActive: z.boolean(),
    archivedAt: z.string().nullable().or(z.date().nullable()),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
});

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

export const walletSummaryResponseSchema = z.object({
    accounts: z.array(financialAccountSchema),
});

export const transactionHistoryResponseSchema = z.object({
    data: z.array(z.any()), // Can be more specific later if relations are complex
    page: z.number(),
    pageSize: z.number(),
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

export const createFinancialAccountResponseSchema = financialAccountSchema;

export const listFinancialAccountsResponseSchema = z.object({
    accounts: z.array(financialAccountSchema),
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
    currencies: z.array(currencyWithStatusSchema),
});
