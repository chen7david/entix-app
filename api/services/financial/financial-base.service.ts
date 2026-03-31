import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type {
    CreateTransactionInput,
    FinancialTransactionsRepository,
} from "@api/repositories/financial/financial-transactions.repository";
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
        // 1. Currency Mismatch Guard (Shared logic used by all domains)
        const [source, destination] = await Promise.all([
            this.accountsRepo.findById(input.sourceAccountId),
            this.accountsRepo.findById(input.destinationAccountId),
        ]);

        if (!source || !destination) {
            throw new Error("Source or destination account not found");
        }

        if (
            source.currencyId !== destination.currencyId ||
            source.currencyId !== input.currencyId
        ) {
            throw new Error(
                `Currency mismatch: Source (${source.currencyId}), Destination (${destination.currencyId}), and Transaction (${input.currencyId}) must all match.`
            );
        }

        // 2. Delegate to repository for atomic D1 batch execution
        return this.transactionsRepo.executeTransaction(input);
    }

    /**
     * Deactivates an account to prevent further transactions.
     */
    async deactivateAccount(accountId: string) {
        return this.accountsRepo.deactivate(accountId);
    }
}
