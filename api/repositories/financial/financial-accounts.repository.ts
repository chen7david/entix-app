import { BadRequestError, InternalServerError } from "@api/errors/app.error";
import type { AppDb } from "@api/factories/db.factory";
import {
    type CreateAccountRepoInput,
    type FinancialAccount,
    financialAccounts,
} from "@shared/db/schema";
import { and, eq, isNull, ne } from "drizzle-orm";

/**
 * Repository for financial account database operations.
 */
export class FinancialAccountsRepository {
    constructor(private readonly db: AppDb) {}

    /**
     * Creates a new financial account.
     * Throws on database failure.
     */
    async insert(input: CreateAccountRepoInput): Promise<FinancialAccount> {
        try {
            const [account] = await this.db
                .insert(financialAccounts)
                .values({
                    ...input,
                    balanceCents: input.balanceCents ?? 0,
                    isActive: input.isActive ?? true,
                    accountType: input.accountType ?? "savings",
                    overdraftLimitCents: input.overdraftLimitCents ?? null,
                })
                .returning();

            if (!account) {
                throw new InternalServerError("Failed to insert financial account");
            }

            return account;
        } catch (err: any) {
            const msg = err.message || String(err);
            const causeMsg = err.cause?.message || "";
            const isConstraint =
                msg.includes("constraint failed") ||
                msg.includes("NOT NULL") ||
                causeMsg.includes("constraint failed") ||
                causeMsg.includes("NOT NULL");

            if (isConstraint) {
                throw new BadRequestError(`Account creation failed: ${msg} ${causeMsg}`);
            }
            throw err;
        }
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
        organizationId: string
    ): Promise<FinancialAccount[]> {
        return this.db
            .select()
            .from(financialAccounts)
            .where(
                and(
                    eq(financialAccounts.ownerId, ownerId),
                    eq(financialAccounts.ownerType, ownerType),
                    eq(financialAccounts.organizationId, organizationId),
                    eq(financialAccounts.isActive, true),
                    isNull(financialAccounts.archivedAt)
                )
            );
    }

    /**
     * Retrieves all active, non-archived accounts for any owner of a specific type.
     * Excludes the 'platform' owner to return only organizations/user accounts.
     */
    async findActiveByOwnerType(ownerType: "user" | "org"): Promise<FinancialAccount[]> {
        return this.db
            .select()
            .from(financialAccounts)
            .where(
                and(
                    eq(financialAccounts.ownerType, ownerType),
                    eq(financialAccounts.isActive, true),
                    isNull(financialAccounts.archivedAt),
                    ne(financialAccounts.ownerId, "platform")
                )
            );
    }

    /**
     * Deactivates an account (sets isActive to false).
     * Used to block new transactions.
     */
    async deactivate(id: string, updatedAt: Date): Promise<FinancialAccount | null> {
        const [account] = await this.db
            .update(financialAccounts)
            .set({
                isActive: false,
                updatedAt,
            })
            .where(eq(financialAccounts.id, id))
            .returning();

        return account ?? null;
    }

    /**
     * Archives an account (sets archivedAt timestamp).
     * Used to hide the account from standard UI views.
     */
    async archive(id: string, updatedAt: Date): Promise<FinancialAccount | null> {
        const [account] = await this.db
            .update(financialAccounts)
            .set({
                archivedAt: updatedAt,
                updatedAt,
            })
            .where(eq(financialAccounts.id, id))
            .returning();

        return account ?? null;
    }

    /**
     * Updates the display name of an account.
     */
    async updateName(id: string, name: string, updatedAt: Date): Promise<FinancialAccount | null> {
        const [account] = await this.db
            .update(financialAccounts)
            .set({
                name,
                updatedAt,
            })
            .where(eq(financialAccounts.id, id))
            .returning();

        return account ?? null;
    }

    /**
     * Updates the overdraft limit of an account.
     * Passing null makes the account inherit the limit from its billing plan.
     */
    async updateOverdraftLimit(
        id: string,
        overdraftLimitCents: number | null,
        updatedAt: Date
    ): Promise<FinancialAccount | null> {
        const [account] = await this.db
            .update(financialAccounts)
            .set({
                overdraftLimitCents,
                updatedAt,
            })
            .where(eq(financialAccounts.id, id))
            .returning();

        return account ?? null;
    }

    /**
     * Finds active, non-archived accounts for an organization.
     */
    async findAllByOrg(orgId: string): Promise<FinancialAccount[]> {
        return this.db.query.financialAccounts.findMany({
            where: and(
                eq(financialAccounts.ownerId, orgId),
                eq(financialAccounts.ownerType, "org"),
                eq(financialAccounts.isActive, true),
                isNull(financialAccounts.archivedAt)
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
        organizationId: string
    ): Promise<boolean> {
        const [existing] = await this.db
            .select({ id: financialAccounts.id })
            .from(financialAccounts)
            .where(
                and(
                    eq(financialAccounts.ownerId, ownerId),
                    eq(financialAccounts.name, name),
                    eq(financialAccounts.currencyId, currencyId),
                    eq(financialAccounts.organizationId, organizationId)
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
        organizationId: string
    ): Promise<boolean> {
        const [existing] = await this.db
            .select({ id: financialAccounts.id })
            .from(financialAccounts)
            .where(
                and(
                    eq(financialAccounts.ownerId, ownerId),
                    eq(financialAccounts.ownerType, ownerType),
                    eq(financialAccounts.currencyId, currencyId),
                    eq(financialAccounts.organizationId, organizationId),
                    eq(financialAccounts.isActive, true)
                )
            )
            .limit(1);

        return !!existing;
    }
}
