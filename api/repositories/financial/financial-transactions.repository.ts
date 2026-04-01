import type { AppDb } from "@api/factories/db.factory";
import {
    financialAccounts,
    financialTransactionLines,
    financialTransactions,
} from "@shared/db/schema";
import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export type CreateTransactionInput = {
    organizationId: string;
    categoryId: string;
    sourceAccountId: string;
    destinationAccountId: string;
    currencyId: string;
    amountCents: number;
    description?: string;
    transactionDate: Date;
};

export type PaginationInput = {
    page: number;
    pageSize: number;
};

export type TransactionFilters = PaginationInput & {
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    txId?: string;
    accountId?: string;
    status?: "pending" | "completed" | "reversed";
    categoryId?: string;
};

/**
 * Financial transactions are NEVER hard-deleted to preserve ledger integrity.
 * All writes go through FinancialService.executeTransaction() via db.batch()
 * to guarantee atomicity on Cloudflare D1.
 *
 * This repository primarily handles prepared statements for atomic batching.
 */
export class FinancialTransactionsRepository {
    constructor(private readonly db: AppDb) {}

    async findById(id: string) {
        const transaction = await this.db.query.financialTransactions.findFirst({
            where: eq(financialTransactions.id, id),
            with: {
                sourceAccount: true,
                destinationAccount: true,
                category: true,
                currency: true,
            },
        });
        return transaction ?? null;
    }

    async reverse(txId: string) {
        return this.db
            .update(financialTransactions)
            .set({
                status: "reversed",
            })
            .where(eq(financialTransactions.id, txId));
    }

    /**
     * Returns the four raw D1-compatible statements needed for one
     * complete double-entry transaction. Intended to be passed directly
     * into db.batch([...]) inside FinancialService.executeTransaction().
     *
     * Statements (in order):
     * 1. Debit source account (balance - amountCents)
     * 2. Credit destination account (balance + amountCents)
     * 3. Insert financial_transactions record
     * 4. Insert two financial_transaction_lines (debit + credit pair)
     */
    prepareStatements(input: CreateTransactionInput) {
        const txId = nanoid();
        const debitLineId = nanoid();
        const creditLineId = nanoid();
        const now = new Date();

        const debitSourceAccount = this.db
            .update(financialAccounts)
            .set({
                balanceCents: sql`${financialAccounts.balanceCents} - ${input.amountCents}`,
                updatedAt: now,
            })
            .where(
                and(
                    eq(financialAccounts.id, input.sourceAccountId),
                    sql`${financialAccounts.balanceCents} >= ${input.amountCents}`
                )
            );

        const creditDestinationAccount = this.db
            .update(financialAccounts)
            .set({
                balanceCents: sql`${financialAccounts.balanceCents} + ${input.amountCents}`,
                updatedAt: now,
            })
            .where(eq(financialAccounts.id, input.destinationAccountId));

        const insertTransaction = this.db.insert(financialTransactions).values({
            id: txId,
            organizationId: input.organizationId,
            categoryId: input.categoryId,
            sourceAccountId: input.sourceAccountId,
            destinationAccountId: input.destinationAccountId,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            status: "completed",
            description: input.description ?? null,
            transactionDate: input.transactionDate,
            createdAt: now,
        });

        const insertLines = this.db.insert(financialTransactionLines).values([
            {
                id: debitLineId,
                transactionId: txId,
                accountId: input.sourceAccountId,
                direction: "debit",
                amountCents: input.amountCents,
                createdAt: now,
            },
            {
                id: creditLineId,
                transactionId: txId,
                accountId: input.destinationAccountId,
                direction: "credit",
                amountCents: input.amountCents,
                createdAt: now,
            },
        ]);

        return {
            txId,
            statements: [
                debitSourceAccount,
                creditDestinationAccount,
                insertTransaction,
                insertLines,
            ],
        };
    }

    /**
     * Executes a complete double-entry transaction atomically.
     * Services should use this instead of direct db.batch calls.
     */
    async insert(input: CreateTransactionInput): Promise<string> {
        const { txId, statements } = this.prepareStatements(input);
        await this.db.batch(statements as any);
        return txId;
    }

    async findByOrgId(organizationId: string, filters: TransactionFilters) {
        const conditions = [eq(financialTransactions.organizationId, organizationId)];

        if (filters.startDate) {
            conditions.push(
                gte(financialTransactions.transactionDate, new Date(filters.startDate))
            );
        }
        if (filters.endDate) {
            conditions.push(lte(financialTransactions.transactionDate, new Date(filters.endDate)));
        }
        if (filters.minAmount) {
            conditions.push(gte(financialTransactions.amountCents, filters.minAmount));
        }
        if (filters.maxAmount) {
            conditions.push(lte(financialTransactions.amountCents, filters.maxAmount));
        }
        if (filters.txId) {
            conditions.push(like(financialTransactions.id, `%${filters.txId}%`));
        }
        if (filters.status) {
            conditions.push(eq(financialTransactions.status, filters.status));
        }
        if (filters.categoryId) {
            conditions.push(eq(financialTransactions.categoryId, filters.categoryId));
        }
        if (filters.accountId) {
            conditions.push(
                or(
                    eq(financialTransactions.sourceAccountId, filters.accountId),
                    eq(financialTransactions.destinationAccountId, filters.accountId)
                ) as any
            );
        }

        const offset = (filters.page - 1) * filters.pageSize;

        return this.db.query.financialTransactions.findMany({
            where: and(...conditions),
            with: {
                sourceAccount: true,
                destinationAccount: true,
                category: true,
                currency: true,
            },
            orderBy: [desc(financialTransactions.transactionDate)],
            limit: filters.pageSize,
            offset,
        });
    }

    async findByAccountId(accountId: string, { page, pageSize }: PaginationInput) {
        const offset = (page - 1) * pageSize;
        return this.db.query.financialTransactionLines.findMany({
            where: eq(financialTransactionLines.accountId, accountId),
            with: {
                transaction: {
                    with: {
                        category: true,
                        currency: true,
                    },
                },
            },
            orderBy: [desc(financialTransactionLines.createdAt)],
            limit: pageSize,
            offset,
        });
    }

    /**
     * Fetches transaction lines for all accounts owned by a specific owner.
     * Required for UserFinancialService to show personal wallets' history.
     */
    /**
     * Fetches transaction lines for all accounts owned by a specific owner.
     * Required for UserFinancialService to show personal wallets' history.
     */
    async findByOwnerId(
        ownerId: string,
        ownerType: "user" | "org",
        { page, pageSize }: PaginationInput,
        organizationId?: string
    ) {
        const offset = (page - 1) * pageSize;

        // Since D1/Drizzle relations don't easily support deep filtering on joins for pagination,
        // we first get the IDs of the accounts owned by the user.
        const ownerAccounts = await this.db.query.financialAccounts.findMany({
            where: and(
                eq(financialAccounts.ownerId, ownerId),
                eq(financialAccounts.ownerType, ownerType),
                organizationId
                    ? eq(financialAccounts.organizationId, organizationId)
                    : sql`${financialAccounts.organizationId} IS NULL`
            ),
            columns: { id: true },
        });

        const accountIds = ownerAccounts.map((a) => a.id);
        if (accountIds.length === 0) return [];

        return this.db.query.financialTransactionLines.findMany({
            where: sql`${financialTransactionLines.accountId} IN ${accountIds}`,
            with: {
                transaction: {
                    with: {
                        sourceAccount: true,
                        destinationAccount: true,
                        category: true,
                        currency: true,
                    },
                },
                account: true,
            },
            orderBy: [desc(financialTransactionLines.createdAt)],
            limit: pageSize,
            offset,
        });
    }
}
