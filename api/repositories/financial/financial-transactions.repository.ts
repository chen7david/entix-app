import type { AppDb } from "@api/factories/db.factory";
import {
    type CreateTransactionRepoInput,
    financialAccounts,
    financialTransactionLines,
    financialTransactions,
} from "@shared/db/schema";
import type { PaginationInput, TransactionFilters } from "@shared/schemas/dto/financial.dto";
import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";

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
     * Prepares the SQL statements required for an atomic double-entry transaction.
     * 1. Debit the source account (with balance guard)
     * 2. Credit the destination account
     * 3. Insert the transaction header
     * 4. Insert the transaction lines
     */
    prepareStatements(input: CreateTransactionRepoInput) {
        // 1. Debit Source
        const debitStatement = this.db
            .update(financialAccounts)
            .set({
                balanceCents: sql`${financialAccounts.balanceCents} - ${input.amountCents}`,
                updatedAt: input.createdAt,
            })
            .where(
                and(
                    eq(financialAccounts.id, input.sourceAccountId),
                    eq(financialAccounts.isActive, true),
                    gte(financialAccounts.balanceCents, input.amountCents)
                )
            );

        // 2. Credit Destination
        const creditStatement = this.db
            .update(financialAccounts)
            .set({
                balanceCents: sql`${financialAccounts.balanceCents} + ${input.amountCents}`,
                updatedAt: input.createdAt,
            })
            .where(
                and(
                    eq(financialAccounts.id, input.destinationAccountId),
                    eq(financialAccounts.isActive, true)
                )
            );

        // 3. Insert Transaction Header
        const insertStatement = this.db.insert(financialTransactions).values({
            id: input.id,
            organizationId: input.organizationId,
            categoryId: input.categoryId,
            sourceAccountId: input.sourceAccountId,
            destinationAccountId: input.destinationAccountId,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            description: input.description,
            transactionDate: input.transactionDate,
            createdAt: input.createdAt,
            status: "completed",
        });

        // 4. Insert Transaction Lines (for audit trail)
        const debitLineStatement = this.db.insert(financialTransactionLines).values({
            id: input.debitLineId,
            transactionId: input.id,
            accountId: input.sourceAccountId,
            amountCents: input.amountCents,
            direction: "debit",
            createdAt: input.createdAt,
        });

        const creditLineStatement = this.db.insert(financialTransactionLines).values({
            id: input.creditLineId,
            transactionId: input.id,
            accountId: input.destinationAccountId,
            amountCents: input.amountCents,
            direction: "credit",
            createdAt: input.createdAt,
        });

        return [
            debitStatement,
            creditStatement,
            insertStatement,
            debitLineStatement,
            creditLineStatement,
        ] as const;
    }

    /**
     * Atomic double-entry insert using D1 batch.
     */
    async insert(input: CreateTransactionRepoInput): Promise<string> {
        const statements = this.prepareStatements(input);
        const [debitResult] = await this.db.batch(statements as any);

        // Verify the debit actually hit a row (balance check + active check)
        if (debitResult.meta.rows_written === 0) {
            throw new Error("Insufficient funds, inactive account, or currency mismatch");
        }

        return input.id;
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
