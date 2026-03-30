import type { AppDb } from "@api/factories/db.factory";
import {
    type FinancialCurrency,
    financialCurrencies,
    type NewFinancialCurrency,
} from "@shared/db/schema";
import { eq, isNull } from "drizzle-orm";
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
    async create(input: NewFinancialCurrency): Promise<FinancialCurrency> {
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
    }

    /**
     * Finds a currency by ID.
     */
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

    /**
     * Returns all currencies, including archived ones.
     * Typically used for admin management views.
     */
    async findAll(): Promise<FinancialCurrency[]> {
        return this.db.select().from(financialCurrencies);
    }

    /**
     * Returns only active (non-archived) currencies.
     * Used for user-facing selection dropdowns.
     */
    async findActive(): Promise<FinancialCurrency[]> {
        return this.db
            .select()
            .from(financialCurrencies)
            .where(isNull(financialCurrencies.archivedAt));
    }

    /**
     * Archives a currency by setting the archivedAt timestamp.
     * @throws Error if the currency is not found.
     */
    async archive(id: string): Promise<FinancialCurrency> {
        const [currency] = await this.db
            .update(financialCurrencies)
            .set({ archivedAt: new Date() })
            .where(eq(financialCurrencies.id, id))
            .returning();

        return currency ?? null;
    }
}
