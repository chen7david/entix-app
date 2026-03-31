import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type {
    CreateTransactionInput,
    FinancialTransactionsRepository,
} from "@api/repositories/financial/financial-transactions.repository";
import { getTreasuryAccountId } from "@shared";
import { BadRequestError } from "../../errors/app.error";
import { BaseService } from "../base.service";

/**
 * FinancialBaseService is the abstract foundation for all financial domain services.
 * It owns the core 'Double-Entry' transaction logic and shared validation guards.
 *
 * DO NOT instantiate this service directly.
 */
export abstract class FinancialBaseService extends BaseService {
    constructor(
        protected readonly db: AppDb,
        protected readonly accountsRepo: FinancialAccountsRepository,
        protected readonly transactionsRepo: FinancialTransactionsRepository
    ) {
        super();
    }

    /**
     * Executes an atomic double-entry transaction.
     * Includes a strict currency mismatch guard to prevent cross-currency transfers.
     */
    protected async executeTransaction(input: CreateTransactionInput) {
        // 1. Core Record Existence Guard (Source, Destination, and Category)
        const [source, destination, category] = await Promise.all([
            this.accountsRepo.findById(input.sourceAccountId),
            this.accountsRepo.findById(input.destinationAccountId),
            this.db.query.financialTransactionCategories.findFirst({
                where: (categories, { eq }) => eq(categories.id, input.categoryId),
            }),
        ]);

        if (!source || !destination) {
            throw new BadRequestError(
                `Source (${input.sourceAccountId}) or destination (${input.destinationAccountId}) account not found`
            );
        }

        if (!category) {
            throw new BadRequestError(
                `Invalid transaction category: "${input.categoryId}". Ensure financial foundations are seeded.`
            );
        }

        if (
            source.currencyId !== destination.currencyId ||
            source.currencyId !== input.currencyId
        ) {
            throw new BadRequestError(
                `Currency mismatch: Source (${source.currencyId}), Destination (${destination.currencyId}), and Transaction (${input.currencyId}) must all match.`
            );
        }

        // 2. Treasury Guard: Only General Fund accounts can transact with platform treasury
        const treasuryId = getTreasuryAccountId(input.currencyId);
        if (source.id === treasuryId || destination.id === treasuryId) {
            const orgAccount = source.id === treasuryId ? destination : source;

            if (!orgAccount.isFundingAccount) {
                throw new BadRequestError(
                    "Only General Fund accounts can transact with the platform treasury. " +
                        "Custom accounts must receive funds via internal transfer from a General Fund account."
                );
            }
        }

        // 3. Insufficient Funds Guard (Shared logic for all transfers)
        if (source.balanceCents < input.amountCents) {
            throw new BadRequestError("Insufficient treasury funds");
        }

        // 3. Delegate to repository for atomic D1 batch execution
        return this.transactionsRepo.executeTransaction(input);
    }

    /**
     * Deactivates an account to prevent further transactions.
     */
    async deactivateAccount(accountId: string) {
        return this.accountsRepo.deactivate(accountId);
    }
}
