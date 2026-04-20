import type { AppDb } from "@api/factories/db.factory";
import {
    type FinancialTransactionCategory,
    financialTransactionCategories,
    type NewFinancialTransactionCategory,
} from "@shared/db/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Repository for managing financial transaction categories.
 * Categories are used to track revenue/expense types and are archived rather than deleted.
 */
export class FinancialTransactionCategoriesRepository {
    constructor(private readonly db: AppDb) {}

    /**
     * Creates a new transaction category.
     * `id` MUST be generated in the Service layer (API.md), e.g. `generateCategoryId()` from `@shared/lib/id`.
     */
    async create(
        id: string,
        input: NewFinancialTransactionCategory
    ): Promise<FinancialTransactionCategory | null> {
        const [category] = await this.db
            .insert(financialTransactionCategories)
            .values({
                ...input,
                id,
                archivedAt: null,
            })
            .returning();

        return category ?? null;
    }

    async findCategoryById(id: string): Promise<FinancialTransactionCategory | null> {
        const category = await this.db.query.financialTransactionCategories.findFirst({
            where: eq(financialTransactionCategories.id, id),
        });
        return category ?? null;
    }

    async findCategories(): Promise<FinancialTransactionCategory[]> {
        return this.db.select().from(financialTransactionCategories);
    }

    /**
     * Returns only active (non-archived) categories.
     * Used for user-facing selection dropdowns in transaction forms.
     */
    async findActive(): Promise<FinancialTransactionCategory[]> {
        return this.db
            .select()
            .from(financialTransactionCategories)
            .where(isNull(financialTransactionCategories.archivedAt));
    }

    /**
     * Archives a category by setting the archivedAt timestamp.
     * @throws Error if the category is not found.
     */
    async archive(id: string): Promise<FinancialTransactionCategory> {
        const [category] = await this.db
            .update(financialTransactionCategories)
            .set({ archivedAt: new Date() })
            .where(eq(financialTransactionCategories.id, id))
            .returning();

        return category ?? null;
    }
}
