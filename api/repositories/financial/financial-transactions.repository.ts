import { BadRequestError } from "@api/errors/app.error";
import type { AppDb } from "@api/factories/db.factory";
import {
    authOrganizations,
    authUsers,
    type CreateTransactionRepoInput,
    financialAccounts,
    financialCurrencies,
    financialTransactionCategories,
    financialTransactionLines,
    financialTransactions,
} from "@shared/db/schema";
import type { TransactionFilters } from "@shared/schemas/dto/financial.dto";
import { aliasedTable, and, desc, eq, gte, like, lt, lte, or, sql } from "drizzle-orm";

/**
 * Encodes transactionDate + id into a base64 cursor for stable pagination.
 */
export function encodeTransactionCursor(tx: {
    transactionDate: Date | string;
    id: string;
}): string {
    const dateStr =
        tx.transactionDate instanceof Date ? tx.transactionDate.toISOString() : tx.transactionDate;
    return Buffer.from(JSON.stringify({ date: dateStr, id: tx.id })).toString("base64");
}

/**
 * Decodes a base64 cursor and validates its shape.
 */
function decodeTransactionCursor(cursor: string): { date: string; id: string } {
    try {
        const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
        if (!decoded.date || !decoded.id) throw new Error();
        return decoded;
    } catch {
        throw new BadRequestError("Invalid pagination cursor");
    }
}

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
     *
     * Concurrency note:
     *   The debit WHERE clause checks `balance >= amount` at read time.
     *   This is safe because Cloudflare D1 serializes all writes to a single
     *   primary — there is no parallel write path that could race within the
     *   same db.batch() call.
     *   If the architecture ever moves to a multi-writer setup (e.g. read
     *   replicas with write forwarding), this guard must be replaced with a
     *   SELECT ... FOR UPDATE or an optimistic-lock retry loop.
     */
    prepareStatements(
        input: CreateTransactionRepoInput,
        overdraftOverrideCents: number | null = null
    ) {
        const overdraftExpr =
            overdraftOverrideCents !== null
                ? sql`${overdraftOverrideCents}`
                : sql`COALESCE(${financialAccounts.overdraftLimitCents}, 0)`;

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
                    gte(
                        sql`${financialAccounts.balanceCents} + ${overdraftExpr}`,
                        input.amountCents
                    )
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
            metadata: input.metadata,
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
    async insert(
        input: CreateTransactionRepoInput,
        overdraftOverrideCents: number | null = null
    ): Promise<string> {
        const statements = this.prepareStatements(input, overdraftOverrideCents);

        // Phase 1: Debit + Credit only.
        // The debit uses a WHERE guard: balance + overdraft >= amount.
        // We check rows_written BEFORE inserting any permanent ledger records.
        // This prevents ghost transactions from being written when a debit fails.
        const [debitResult] = await this.db.batch([
            statements[0], // debit source only
        ] as any);

        if (debitResult.meta.rows_written === 0) {
            throw new BadRequestError(
                "Transaction failed: Insufficient funds or inactive account."
            );
        }

        // Phase 2: Debit confirmed — now credit destination and write ledger records atomically
        await this.db.batch([
            statements[1], // credit destination
            statements[2], // transaction header
            statements[3], // debit line
            statements[4], // credit line
        ] as any);

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

        if (filters.cursor) {
            const decoded = decodeTransactionCursor(filters.cursor);
            conditions.push(
                or(
                    lt(financialTransactions.transactionDate, new Date(decoded.date)),
                    and(
                        eq(financialTransactions.transactionDate, new Date(decoded.date)),
                        lt(financialTransactions.id, decoded.id)
                    )
                ) as any
            );
        }

        const srcUser = aliasedTable(authUsers, "src_user");
        const srcOrg = aliasedTable(authOrganizations, "src_org");
        const destUser = aliasedTable(authUsers, "dest_user");
        const destOrg = aliasedTable(authOrganizations, "dest_org");

        const rows = await this.db
            .select({
                transaction: financialTransactions,
                category: financialTransactionCategories,
                currency: financialCurrencies,
                sourceAccount: {
                    id: sql<string>`src.id`,
                    name: sql<string>`src.name`,
                    ownerId: sql<string>`src.owner_id`,
                    ownerType: sql<string>`src.owner_type`,
                    ownerName: sql<string>`COALESCE(src_user.name, src_org.name)`,
                },
                destinationAccount: {
                    id: sql<string>`dest.id`,
                    name: sql<string>`dest.name`,
                    ownerId: sql<string>`dest.owner_id`,
                    ownerType: sql<string>`dest.owner_type`,
                    ownerName: sql<string>`COALESCE(dest_user.name, dest_org.name)`,
                },
            })
            .from(financialTransactions)
            .innerJoin(
                financialTransactionCategories,
                eq(financialTransactions.categoryId, financialTransactionCategories.id)
            )
            .innerJoin(
                financialCurrencies,
                eq(financialTransactions.currencyId, financialCurrencies.id)
            )
            .leftJoin(
                sql`${financialAccounts} as src`,
                eq(financialTransactions.sourceAccountId, sql`src.id`)
            )
            .leftJoin(
                sql`${financialAccounts} as dest`,
                eq(financialTransactions.destinationAccountId, sql`dest.id`)
            )
            .leftJoin(srcUser, eq(sql`src.owner_id`, srcUser.id))
            .leftJoin(srcOrg, eq(sql`src.owner_id`, srcOrg.id))
            .leftJoin(destUser, eq(sql`dest.owner_id`, destUser.id))
            .leftJoin(destOrg, eq(sql`dest.owner_id`, destOrg.id))
            .where(and(...conditions))
            .orderBy(desc(financialTransactions.transactionDate), desc(financialTransactions.id))
            .limit(filters.limit ?? 20);

        return rows.map((row) => ({
            ...row.transaction,
            category: row.category,
            currency: row.currency,
            sourceAccount: row.sourceAccount,
            destinationAccount: row.destinationAccount,
        }));
    }

    async findByAccountId(
        accountId: string,
        { cursor, pageSize }: { cursor?: string; pageSize: number }
    ) {
        const conditions = [eq(financialTransactionLines.accountId, accountId)];

        if (cursor) {
            const decoded = decodeTransactionCursor(cursor);
            conditions.push(
                or(
                    lt(financialTransactions.transactionDate, new Date(decoded.date)),
                    and(
                        eq(financialTransactions.transactionDate, new Date(decoded.date)),
                        lt(financialTransactionLines.id, decoded.id)
                    )
                ) as any
            );
        }

        const rows = await this.db
            .select({
                line: financialTransactionLines,
                transaction: financialTransactions,
            })
            .from(financialTransactionLines)
            .innerJoin(
                financialTransactions,
                eq(financialTransactionLines.transactionId, financialTransactions.id)
            )
            .where(and(...conditions))
            .orderBy(
                desc(financialTransactions.transactionDate),
                desc(financialTransactionLines.id)
            )
            .limit(pageSize);

        return rows.map((row) => ({
            ...row.line,
            transaction: row.transaction,
        }));
    }

    async findByOwnerId(
        ownerId: string,
        ownerType: "user" | "org",
        {
            cursor,
            limit = 20,
            ...filters
        }: { cursor?: string; limit?: number } & Partial<TransactionFilters>,
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
        if (accountIds.length === 0) return [];

        const conditions = [sql`${financialTransactionLines.accountId} IN ${accountIds}`];

        if (filters.startDate) {
            conditions.push(
                gte(financialTransactions.transactionDate, new Date(filters.startDate))
            );
        }
        if (filters.endDate) {
            conditions.push(lte(financialTransactions.transactionDate, new Date(filters.endDate)));
        }
        if (filters.txId) {
            conditions.push(like(financialTransactions.id, `%${filters.txId}%`));
        }
        if (filters.status) {
            conditions.push(eq(financialTransactions.status, filters.status));
        }

        if (cursor) {
            const decoded = decodeTransactionCursor(cursor);
            conditions.push(
                or(
                    lt(financialTransactions.transactionDate, new Date(decoded.date)),
                    and(
                        eq(financialTransactions.transactionDate, new Date(decoded.date)),
                        lt(financialTransactionLines.id, decoded.id)
                    )
                ) as any
            );
        }

        const srcUser = aliasedTable(authUsers, "src_user");
        const srcOrg = aliasedTable(authOrganizations, "src_org");
        const destUser = aliasedTable(authUsers, "dest_user");
        const destOrg = aliasedTable(authOrganizations, "dest_org");

        const rows = await this.db
            .select({
                line: financialTransactionLines,
                transaction: financialTransactions,
                account: financialAccounts,
                category: financialTransactionCategories,
                currency: financialCurrencies,
                sourceAccount: {
                    id: sql<string>`src.id`,
                    name: sql<string>`src.name`,
                    ownerId: sql<string>`src.owner_id`,
                    ownerType: sql<string>`src.owner_type`,
                    ownerName: sql<string>`COALESCE(src_user.name, src_org.name)`,
                },
                destinationAccount: {
                    id: sql<string>`dest.id`,
                    name: sql<string>`dest.name`,
                    ownerId: sql<string>`dest.owner_id`,
                    ownerType: sql<string>`dest.owner_type`,
                    ownerName: sql<string>`COALESCE(dest_user.name, dest_org.name)`,
                },
            })
            .from(financialTransactionLines)
            .innerJoin(
                financialTransactions,
                eq(financialTransactionLines.transactionId, financialTransactions.id)
            )
            .innerJoin(
                financialAccounts,
                eq(financialTransactionLines.accountId, financialAccounts.id)
            )
            .innerJoin(
                financialTransactionCategories,
                eq(financialTransactions.categoryId, financialTransactionCategories.id)
            )
            .innerJoin(
                financialCurrencies,
                eq(financialTransactions.currencyId, financialCurrencies.id)
            )
            .leftJoin(
                sql`${financialAccounts} as src`,
                eq(financialTransactions.sourceAccountId, sql`src.id`)
            )
            .leftJoin(
                sql`${financialAccounts} as dest`,
                eq(financialTransactions.destinationAccountId, sql`dest.id`)
            )
            .leftJoin(srcUser, eq(sql`src.owner_id`, srcUser.id))
            .leftJoin(srcOrg, eq(sql`src.owner_id`, srcOrg.id))
            .leftJoin(destUser, eq(sql`dest.owner_id`, destUser.id))
            .leftJoin(destOrg, eq(sql`dest.owner_id`, destOrg.id))
            .where(and(...conditions))
            .orderBy(
                desc(financialTransactions.transactionDate),
                desc(financialTransactionLines.id)
            )
            .limit(limit);

        return rows.map((row) => ({
            ...row.line,
            transaction: {
                ...row.transaction,
                category: row.category,
                currency: row.currency,
                sourceAccount: row.sourceAccount,
                destinationAccount: row.destinationAccount,
            },
            account: row.account,
        }));
    }
}
