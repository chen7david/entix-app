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
import { aliasedTable, and, desc, eq, gte, like, lt, lte, or, type SQL, sql } from "drizzle-orm";

export const LEDGER_BATCH_INDEX = {
    credit: 0,
    header: 1,
    debitLine: 2,
    creditLine: 3,
    debit: 4,
} as const;

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
 * Decodes a base64 transaction pagination cursor.
 * Returns null if the cursor is malformed — callers in the service layer should
 * reject invalid input with a service-layer `BadRequestError` before hitting the repository.
 */
export function parseTransactionCursor(cursor: string): { date: string; id: string } | null {
    try {
        const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
        if (!decoded?.date || !decoded?.id) return null;
        return { date: decoded.date, id: decoded.id };
    } catch {
        return null;
    }
}

/** @internal Assumes the service layer validated the cursor when present. */
function requireTransactionCursor(cursor: string): { date: string; id: string } {
    const decoded = parseTransactionCursor(cursor);
    if (!decoded) {
        throw new TypeError(
            "FinanceTransactionsRepository: invalid cursor — validate via parseTransactionCursor in the service layer before querying"
        );
    }
    return decoded;
}

/**
 * Outcome of a single-batch ledger insert (no AppError throws from the repository).
 */
export type LedgerInsertOutcome =
    | { ok: true; transactionId: string }
    | { ok: false; code: "idempotency_conflict" }
    | { ok: false; code: "debit_guard_failed" };

/**
 * Builds a stable pagination cursor from the last item in a result set.
 * Returns null if the result set is smaller than the requested limit (no next page).
 * Use this in services instead of inlining the encodeTransactionCursor + null check.
 */
export function buildTransactionCursor(
    items: { transactionDate: Date | string; id: string }[],
    limit: number
): string | null {
    if (items.length < limit) return null;
    const last = items[items.length - 1];
    return encodeTransactionCursor(last);
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
    prepareStatements(input: CreateTransactionRepoInput, guard: SQL) {
        // All guard logic is now handled by the caller and passed in via 'guard'.
        // We just use it to condition our statements.

        // 1. Debit Source (uses the guard directly)
        const debitStatement = this.db
            .update(financialAccounts)
            .set({
                balanceCents: sql`${financialAccounts.balanceCents} - ${input.amountCents}`,
                updatedAt: input.createdAt,
            })
            .where(guard);

        // 2. Credit Destination (matches dest ID AND the guard)
        const creditStatement = this.db
            .update(financialAccounts)
            .set({
                balanceCents: sql`${financialAccounts.balanceCents} + ${input.amountCents}`,
                updatedAt: input.createdAt,
            })
            .where(
                and(
                    eq(financialAccounts.id, input.destinationAccountId),
                    sql`EXISTS (SELECT 1 FROM ${financialAccounts} WHERE ${guard})`
                )
            );

        // 3. Insert Transaction Header — batch-compatible conditional INSERT.
        // Uses a typed SELECT from accounts with the balance guard.
        const insertStatement = this.db.insert(financialTransactions).select(
            this.db
                .select({
                    id: sql`${input.id}`.as("id"),
                    organizationId: sql`${input.organizationId}`.as("organizationId"),
                    categoryId: sql`${input.categoryId}`.as("categoryId"),
                    sourceAccountId: sql`${input.sourceAccountId}`.as("sourceAccountId"),
                    destinationAccountId: sql`${input.destinationAccountId}`.as(
                        "destinationAccountId"
                    ),
                    currencyId: sql`${input.currencyId}`.as("currencyId"),
                    amountCents: sql`${input.amountCents}`.as("amountCents"),
                    status: sql`'completed'`.as("status"),
                    description: sql`${input.description ?? null}`.as("description"),
                    metadata: sql`${input.metadata ? JSON.stringify(input.metadata) : null}`.as(
                        "metadata"
                    ),
                    transactionDate: sql`${input.transactionDate.getTime()}`.as("transactionDate"),
                    idempotencyKey: sql`${input.idempotencyKey ?? null}`.as("idempotencyKey"),
                    createdAt: sql`${input.createdAt.getTime()}`.as("createdAt"),
                })
                .from(financialAccounts)
                .where(guard)
        );

        // 4. Insert Debit Line
        const debitLineStatement = this.db.insert(financialTransactionLines).select(
            this.db
                .select({
                    id: sql`${input.debitLineId}`.as("id"),
                    transactionId: sql`${input.id}`.as("transactionId"),
                    accountId: sql`${input.sourceAccountId}`.as("accountId"),
                    direction: sql`'debit'`.as("direction"),
                    amountCents: sql`${input.amountCents}`.as("amountCents"),
                    createdAt: sql`${input.createdAt.getTime()}`.as("createdAt"),
                })
                .from(financialAccounts)
                .where(guard)
        );

        // 5. Insert Credit Line
        const creditLineStatement = this.db.insert(financialTransactionLines).select(
            this.db
                .select({
                    id: sql`${input.creditLineId}`.as("id"),
                    transactionId: sql`${input.id}`.as("transactionId"),
                    accountId: sql`${input.destinationAccountId}`.as("accountId"),
                    direction: sql`'credit'`.as("direction"),
                    amountCents: sql`${input.amountCents}`.as("amountCents"),
                    createdAt: sql`${input.createdAt.getTime()}`.as("createdAt"),
                })
                .from(financialAccounts)
                .where(guard)
        );

        return [
            creditStatement,
            insertStatement,
            debitLineStatement,
            creditLineStatement,
            debitStatement,
        ] as const;
    }

    /**
     * Atomic double-entry insert using a SINGLE D1 batch.
     *
     * Previous two-phase approach had a gap between Phase 1 (debit) and
     * Phase 2 (credit + ledger), leaving a window where a concurrent
     * request could bypass idempotency or a crash could leave a partial state.
     *
     * In this single-batch approach, all 5 statements (debit, credit, header, 2 lines)
     * are submitted atomically to D1. We then verify that the debit statement actually
     * matched a row; if not (e.g. balance check failed), we throw an error.
     */
    async insert(input: CreateTransactionRepoInput, guard: SQL): Promise<LedgerInsertOutcome> {
        const statements = this.prepareStatements(input, guard);

        // db.batch() returns a readonly tuple; plain any[] would cause TS4104.
        let results: any;
        try {
            // statements are now all proper BatchItem<"sqlite"> objects — no cast needed.
            results = await this.db.batch(statements as Parameters<AppDb["batch"]>[0]);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("UNIQUE constraint failed") && msg.includes("idempotency_key")) {
                return { ok: false, code: "idempotency_conflict" };
            }
            throw err;
        }

        const debitResult = results[LEDGER_BATCH_INDEX.debit];

        if (debitResult.meta.rows_written === 0) {
            return { ok: false, code: "debit_guard_failed" };
        }

        return { ok: true, transactionId: input.id };
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
            const decoded = requireTransactionCursor(filters.cursor);
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
            const decoded = requireTransactionCursor(cursor);
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
            const decoded = requireTransactionCursor(cursor);
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
