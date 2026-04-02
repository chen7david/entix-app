import type { AppDb } from "@api/factories/db.factory";
import {
    type FinancialCurrency,
    financialAccounts,
    financialCurrencies,
    type NewFinancialCurrency,
} from "@shared/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Repository for managing financial currencies.
 * Currencies are archived rather than deleted to maintain historical ledger integrity.
 */
export class FinancialCurrenciesRepository {
    constructor(private readonly db: AppDb) {}

    /**
     * Creates a new currency.
     * Generates a prefixed ID if not provided (though code is often used as ID).
     */
    async insert(input: NewFinancialCurrency): Promise<FinancialCurrency | null> {
        try {
            const id = `fcur_${nanoid(10)}`;

            const [currency] = await this.db
                .insert(financialCurrencies)
                .values({
                    ...input,
                    id,
                    archivedAt: null,
                })
                .returning();

            return currency ?? null;
        } catch (_err) {
            return null;
        }
    }

    async findById(id: string): Promise<FinancialCurrency | null> {
        const currency = await this.db.query.financialCurrencies.findFirst({
            where: eq(financialCurrencies.id, id),
        });
        return currency ?? null;
    }

    /**
     * Finds a currency by its ISO code (e.g., 'USD').
     */
    async findByCode(code: string): Promise<FinancialCurrency | null> {
        const currency = await this.db.query.financialCurrencies.findFirst({
            where: eq(financialCurrencies.code, code.toUpperCase()),
        });
        return currency ?? null;
    }

    async findAll(): Promise<FinancialCurrency[]> {
        return this.db.select().from(financialCurrencies);
    }

    /**
     * Returns only active (non-archived) currencies.
     * Used for user-facing selection dropdowns.
     */
    async findAllActive(): Promise<FinancialCurrency[]> {
        return this.db
            .select()
            .from(financialCurrencies)
            .where(isNull(financialCurrencies.archivedAt));
    }

    /**
     * Archives a currency by setting the archivedAt timestamp.
     */
    async archive(id: string): Promise<FinancialCurrency | null> {
        const [currency] = await this.db
            .update(financialCurrencies)
            .set({ archivedAt: new Date() })
            .where(eq(financialCurrencies.id, id))
            .returning();

        return currency ?? null;
    }

    /**
     * Returns all platform currencies with activation status for this org.
     * Joins active currencies with existing org financial accounts.
     */
    async findAllWithOrgStatus(orgId: string): Promise<any[]> {
        const allCurrencies = await this.db.query.financialCurrencies.findMany({
            where: isNull(financialCurrencies.archivedAt),
        });

        const orgAccounts = await this.db.query.financialAccounts.findMany({
            where: and(
                eq(financialAccounts.ownerId, orgId),
                eq(financialAccounts.ownerType, "org"),
                isNull(financialAccounts.archivedAt)
            ),
        });

        const activatedCurrencyIds = new Set(orgAccounts.map((a) => a.currencyId));

        return allCurrencies.map((currency) => {
            const account = orgAccounts.find((a) => a.currencyId === currency.id);
            return {
                ...currency,
                isActivated: activatedCurrencyIds.has(currency.id),
                accountId: account?.id ?? null,
                balanceCents: account?.balanceCents ?? null,
            };
        });
    }
}
