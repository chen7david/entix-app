import type { AppDb } from "@api/factories/db.factory";
import {
    type FinancialAccount,
    financialAccounts,
    type NewFinancialAccount,
} from "@shared/db/schema";
import { generateAccountId } from "@shared/lib";
import { and, eq, sql } from "drizzle-orm";

/**
 * Repository for financial account database operations.
 * Financial accounts are never hard-deleted to preserve ledger integrity.
 * Use `deactivate()` to block transactions, or `archive()` to hide from UI.
 */
export class FinancialAccountsRepository {
    constructor(private readonly db: AppDb) {}

    /**
     * Creates a new financial account.
     * @throws Error if the insert fails to return the record.
     */
    async create(input: NewFinancialAccount): Promise<FinancialAccount> {
        const now = new Date();
        const id = generateAccountId();

        const [account] = await this.db
            .insert(financialAccounts)
            .values({
                id,
                ownerId: input.ownerId,
                ownerType: input.ownerType,
                currencyId: input.currencyId,
                name: input.name,
                createdAt: now,
                updatedAt: now,
                balanceCents: 0,
                isActive: true,
            })
            .returning();

        return account ?? null;
    }

    /**
     * Finds an account by its unique ID.
     * Returns null if not found.
     */
    async findById(id: string): Promise<FinancialAccount | null> {
        const account = await this.db.query.financialAccounts.findFirst({
            where: eq(financialAccounts.id, id),
        });
        return account ?? null;
    }

    /**
     * Retrieves all active, non-archived accounts for a specific owner.
     */
    async findActiveByOwner(
        ownerId: string,
        ownerType: "user" | "org"
    ): Promise<FinancialAccount[]> {
        return this.db
            .select()
            .from(financialAccounts)
            .where(
                and(
                    eq(financialAccounts.ownerId, ownerId),
                    eq(financialAccounts.ownerType, ownerType),
                    eq(financialAccounts.isActive, true),
                    sql`${financialAccounts.archivedAt} IS NULL`
                )
            );
    }

    /**
     * Deactivates an account (sets isActive to false).
     * Used to block new transactions.
     * @throws Error if the account ID is not found.
     */
    async deactivate(id: string): Promise<FinancialAccount> {
        const [account] = await this.db
            .update(financialAccounts)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(financialAccounts.id, id))
            .returning();

        return account ?? null;
    }

    /**
     * Archives an account (sets archivedAt timestamp).
     * Used to hide the account from standard UI views.
     * @throws Error if the account ID is not found.
     */
    async archive(id: string): Promise<FinancialAccount> {
        const [account] = await this.db
            .update(financialAccounts)
            .set({
                archivedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(financialAccounts.id, id))
            .returning();

        return account ?? null;
    }
}
