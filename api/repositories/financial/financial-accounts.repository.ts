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
                organizationId: input.organizationId,
                name: input.name,
                createdAt: now,
                updatedAt: now,
                balanceCents: 0,
                isActive: true,
            })
            .returning();

        return account ?? null;
    }

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
        ownerType: "user" | "org",
        organizationId?: string
    ): Promise<FinancialAccount[]> {
        return this.db
            .select()
            .from(financialAccounts)
            .where(
                and(
                    eq(financialAccounts.ownerId, ownerId),
                    eq(financialAccounts.ownerType, ownerType),
                    organizationId
                        ? eq(financialAccounts.organizationId, organizationId)
                        : sql`${financialAccounts.organizationId} IS NULL`,
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

    /**
     * Finds active accounts for an organization.
     */
    async getOrgAccounts(orgId: string): Promise<FinancialAccount[]> {
        return this.db.query.financialAccounts.findMany({
            where: and(
                eq(financialAccounts.ownerId, orgId),
                eq(financialAccounts.ownerType, "org"),
                eq(financialAccounts.isActive, true)
            ),
        });
    }

    /**
     * Checks if an account already exists for an owner with the same name and currency.
     */
    async existsByNameAndCurrency(
        ownerId: string,
        name: string,
        currencyId: string,
        organizationId?: string
    ): Promise<boolean> {
        const [existing] = await this.db
            .select({ id: financialAccounts.id })
            .from(financialAccounts)
            .where(
                and(
                    eq(financialAccounts.ownerId, ownerId),
                    eq(financialAccounts.name, name),
                    eq(financialAccounts.currencyId, currencyId),
                    organizationId
                        ? eq(financialAccounts.organizationId, organizationId)
                        : sql`${financialAccounts.organizationId} IS NULL`
                )
            )
            .limit(1);

        return !!existing;
    }

    /**
     * Checks if an account already exists for an owner and currency.
     */
    async existsByOwnerAndCurrency(
        ownerId: string,
        ownerType: "user" | "org",
        currencyId: string,
        organizationId?: string
    ): Promise<boolean> {
        const [existing] = await this.db
            .select({ id: financialAccounts.id })
            .from(financialAccounts)
            .where(
                and(
                    eq(financialAccounts.ownerId, ownerId),
                    eq(financialAccounts.ownerType, ownerType),
                    eq(financialAccounts.currencyId, currencyId),
                    organizationId
                        ? eq(financialAccounts.organizationId, organizationId)
                        : sql`${financialAccounts.organizationId} IS NULL`,
                    eq(financialAccounts.isActive, true)
                )
            )
            .limit(1);

        return !!existing;
    }
}
