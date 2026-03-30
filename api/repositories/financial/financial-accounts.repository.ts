import { and, eq, isNull } from "drizzle-orm";
import type { AppDb } from "@api/factories/db.factory";
import { financialAccounts } from "@shared/db/schema/financial-accounts.schema";
import { generateId } from "@shared/lib/id";

export type CreateFinancialAccountInput = {
    ownerId: string;
    ownerType: "user" | "org";
    currencyId: string;
    name: string;
};

export function createFinancialAccountsRepository(db: AppDb) {
    return {
        /**
         * Create a new financial account.
         * Uses D1 batch for consistency.
         */
        async create(input: CreateFinancialAccountInput) {
            const now = new Date();
            const id = generateId("facc");

            const [rows] = await db.batch([
                db
                    .insert(financialAccounts)
                    .values({
                        id,
                        ownerId: input.ownerId,
                        ownerType: input.ownerType,
                        currencyId: input.currencyId,
                        name: input.name,
                        balanceCents: 0,
                        isActive: true,
                        archivedAt: null,
                        createdAt: now,
                        updatedAt: now,
                    })
                    .returning(),
            ]);

            return rows[0];
        },

        /**
         * Find a financial account by its unique ID.
         */
        async findById(id: string) {
            return db.query.financialAccounts.findFirst({
                where: eq(financialAccounts.id, id),
            });
        },

        /**
         * Find all active and non-archived accounts for a specific owner.
         */
        async findActiveByOwner(ownerId: string, ownerType: "user" | "org") {
            return db
                .select()
                .from(financialAccounts)
                .where(
                    and(
                        eq(financialAccounts.ownerId, ownerId),
                        eq(financialAccounts.ownerType, ownerType),
                        eq(financialAccounts.isActive, true),
                        isNull(financialAccounts.archivedAt)
                    )
                )
                .all();
        },

        /**
         * Deactivate an account. It remains visible in administrative views but is blocked from transactions.
         */
        async deactivate(id: string) {
            const [rows] = await db.batch([
                db
                    .update(financialAccounts)
                    .set({ isActive: false, updatedAt: new Date() })
                    .where(eq(financialAccounts.id, id))
                    .returning(),
            ]);
            return rows[0];
        },

        /**
         * Archive an account. It is hidden from standard user-facing UI, but the record and its history are preserved.
         */
        async archive(id: string) {
            const now = new Date();
            const [rows] = await db.batch([
                db
                    .update(financialAccounts)
                    .set({ archivedAt: now, updatedAt: now })
                    .where(eq(financialAccounts.id, id))
                    .returning(),
            ]);
            return rows[0];
        },

        // Note: Administrative delete methods are intentionally omitted. Financial data is never hard deleted.
    };
}

