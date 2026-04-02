import { BadRequestError } from "@api/errors/app.error";
import type { AppDb } from "@api/factories/db.factory";
import {
    type CreateTransactionRepoInput,
    financialAccounts,
    financialTransactionLines,
    financialTransactions,
} from "@shared/db/schema";
import type { CursorPaginationInput, TransactionFilters } from "@shared/schemas/dto/financial.dto";
import { and, desc, eq, gt, gte, like, lt, lte, or, sql } from "drizzle-orm";
import type { D1Result } from "@cloudflare/workers-types";

/**
 * Financial transactions are NEVER hard-deleted to preserve ledger integrity.
 * All writes go through FinancialService.executeTransaction() via db.batch()
 * to guarantee atomicity on Cloudflare D1.
 *
 * Atomicity note: `insert()` calls `db.batch()` with 5 prepared statements
 * (debit, credit, tx header, debit line, credit line). D1 batch semantics
 * guarantee all-or-nothing execution. The debit statement includes a balance
 * guard in its WHERE clause — if rows_written === 0, BadRequestError is thrown.
 *
 * Note on `db.batch(statements as any)`: Drizzle returns SQLiteUpdateBase objects
 * which don't satisfy D1's ReadonlyArray<D1PreparedStatement> type. This is a
 * known Drizzle/D1 typing gap. The cast is intentional and the result is
 * narrowed to D1Result[] immediately after.
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
            .set({ status: "reversed" })
            .where(eq(financialTransactions.id, txId));
    }

    /**
     * Prepares the 5 SQL statements required for an atomic double-entry transaction:
     * 1. Debit source account (with balance + active guard in WHERE)
     * 2. Credit destination account
     * 3. Insert transaction header
     * 4. Insert debit line
     * 5. Insert credit line
     */
    prepareStatements(input: CreateTransactionRepoInput) {
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
     * Returns the transaction ID on success.
     * Throws BadRequestError if the debit balance guard fails (rows_written === 0).
     */
    async insert(input: CreateTransactionRepoInput): Promise<string> {
        const statements = this.prepareStatements(input);
        // Cast is required: Drizzle returns SQLiteUpdateBase, not D1PreparedStatement.
        // Known Drizzle/D1 typing gap — result narrowed explicitly below.
        const [debitResult] = (await this.db.batch(statements as any)) as [D1Result, ...D1Result[]];

        if (debitResult.meta.rows_written === 0) {
            throw new BadRequestError(
                "Insufficient funds or account is inactive — transaction aborted"
            );
        }

        return input.id;
    }

    /**
     * Cursor-paginated transaction list for an organization with optional filters.
     * Cursor is encoded as `transactionDate_ISO|id` to handle timestamp ties.
     */
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
                ) as ReturnType<typeof eq>
            );
        }

        // Cursor: decode "<isoDate>|<id>" to resume after a specific record
        if (filters.cursor) {
            const [cursorDate, cursorId] = filters.cursor.split("|");
            if (cursorDate && cursorId) {
                conditions.push(
                    or(
                        lt(financialTransactions.transactionDate, new Date(cursorDate)),
                        and(
                            eq(financialTransactions.transactionDate, new Date(cursorDate)),
                            lt(financialTransactions.id, cursorId)
                        )
                    ) as ReturnType<typeof eq>
                );
            }
        }

        const limit = filters.limit ?? 20;
        const rows = await this.db.query.financialTransactions.findMany({
            where: and(...conditions),
            with: {
                sourceAccount: true,
                destinationAccount: true,
                category: true,
                currency: true,
            },
            orderBy: [desc(financialTransactions.transactionDate), desc(financialTransactions.id)],
            limit: limit + 1, // fetch one extra to determine if there is a next page
        });

        const hasMore = rows.length > limit;
        const data = hasMore ? rows.slice(0, limit) : rows;
        const lastRow = data.at(-1);
        const nextCursor = hasMore && lastRow
            ? `${lastRow.transactionDate.toISOString()}|${lastRow.id}`
            : null;

        return { data, nextCursor, prevCursor: filters.cursor ?? null };
    }

    /**
     * Cursor-paginated transaction lines for a specific account.
     * Cursor is encoded as `createdAt_ISO|id`.
     */
    async findByAccountId(accountId: string, pagination: CursorPaginationInput) {
        const conditions = [eq(financialTransactionLines.accountId, accountId)];

        if (pagination.cursor) {
            const [cursorDate, cursorId] = pagination.cursor.split("|");
            if (cursorDate && cursorId) {
                conditions.push(
                    or(
                        lt(financialTransactionLines.createdAt, new Date(cursorDate)),
                        and(
                            eq(financialTransactionLines.createdAt, new Date(cursorDate)),
                            lt(financialTransactionLines.id, cursorId)
                        )
                    ) as ReturnType<typeof eq>
                );
            }
        }

        const limit = pagination.limit ?? 20;
        const rows = await this.db.query.financialTransactionLines.findMany({
            where: and(...conditions),
            with: {
                transaction: {
                    with: { category: true, currency: true },
                },
            },
            orderBy: [
                desc(financialTransactionLines.createdAt),
                desc(financialTransactionLines.id),
            ],
            limit: limit + 1,
        });

        const hasMore = rows.length > limit;
        const data = hasMore ? rows.slice(0, limit) : rows;
        const lastRow = data.at(-1);
        const nextCursor = hasMore && lastRow
            ? `${lastRow.createdAt.toISOString()}|${lastRow.id}`
            : null;

        return { data, nextCursor, prevCursor: pagination.cursor ?? null };
    }

    /**
     * Cursor-paginated transaction lines for all accounts owned by a specific user.
     * Required for UserFinancialService personal wallet history.
     * Cursor is encoded as `createdAt_ISO|id`.
     */
    async findByOwnerId(
        ownerId: string,
        ownerType: "user" | "org",
        pagination: CursorPaginationInput,
        organizationId?: string
    ) {
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
        if (accountIds.length === 0) return { data: [], nextCursor: null, prevCursor: null };

        const conditions = [sql`${financialTransactionLines.accountId} IN ${accountIds}`];

        if (pagination.cursor) {
            const [cursorDate, cursorId] = pagination.cursor.split("|");
            if (cursorDate && cursorId) {
                conditions.push(
                    or(
                        lt(financialTransactionLines.createdAt, new Date(cursorDate)),
                        and(
                            eq(financialTransactionLines.createdAt, new Date(cursorDate)),
                            lt(financialTransactionLines.id, cursorId)
                        )
                    ) as ReturnType<typeof eq>
                );
            }
        }

        const limit = pagination.limit ?? 20;
        const rows = await this.db.query.financialTransactionLines.findMany({
            where: and(...conditions),
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
            orderBy: [
                desc(financialTransactionLines.createdAt),
                desc(financialTransactionLines.id),
            ],
            limit: limit + 1,
        });

        const hasMore = rows.length > limit;
        const data = hasMore ? rows.slice(0, limit) : rows;
        const lastRow = data.at(-1);
        const nextCursor = hasMore && lastRow
            ? `${lastRow.createdAt.toISOString()}|${lastRow.id}`
            : null;

        return { data, nextCursor, prevCursor: pagination.cursor ?? null };
    }
}
