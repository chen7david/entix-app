import type { AppDb } from "@api/factories/db.factory";
import {
    financialAccounts,
    financialTransactionLines,
    financialTransactions,
} from "@shared/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
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

/**
 * Financial transactions are NEVER hard-deleted to preserve ledger integrity.
 * All writes go through FinancialService.executeTransaction() via db.batch()
 * to guarantee atomicity on Cloudflare D1.
 *
 * This repository primarily handles prepared statements for atomic batching.
 */
export class FinancialTransactionsRepository {
    constructor(private readonly db: AppDb) {}

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
    prepareInsertStatements(input: CreateTransactionInput) {
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
    async executeTransaction(input: CreateTransactionInput): Promise<string> {
        const { txId, statements } = this.prepareInsertStatements(input);
        await this.db.batch(statements as any);
        return txId;
    }

    async findByOrg(organizationId: string, { page, pageSize }: PaginationInput) {
        const offset = (page - 1) * pageSize;
        return this.db.query.financialTransactions.findMany({
            where: eq(financialTransactions.organizationId, organizationId),
            with: {
                sourceAccount: true,
                destinationAccount: true,
                category: true,
                currency: true,
            },
            orderBy: [desc(financialTransactions.transactionDate)],
            limit: pageSize,
            offset,
        });
    }

    async findByAccount(accountId: string, { page, pageSize }: PaginationInput) {
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
    async findByOwner(
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
