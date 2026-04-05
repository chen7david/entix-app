import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors/app.error";
import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { ACCOUNT_TYPES } from "@shared";
import { createTransactionRepoInputSchema } from "@shared/db/schema";
import { nanoid } from "nanoid";
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
     * Executes a core double-entry transaction.
     * Enforces currency matching, balance checks, and bidirectional treasury guards.
     */
    async executeTransaction(input: {
        organizationId: string;
        categoryId: string;
        sourceAccountId: string;
        destinationAccountId: string;
        currencyId: string;
        amountCents: number;
        description?: string | null;
        transactionDate?: Date; // Optional, defaults to now
    }): Promise<string> {
        const [source, destination] = await Promise.all([
            this.accountsRepo.findById(input.sourceAccountId),
            this.accountsRepo.findById(input.destinationAccountId),
        ]);

        if (!source || !destination) {
            throw new NotFoundError("Source or destination account not found");
        }

        // Ledger Hardening: Currency Isolation
        if (source.currencyId !== input.currencyId || destination.currencyId !== input.currencyId) {
            throw new BadRequestError("Currency mismatch between accounts and transaction");
        }

        // Safety Guard: Treasury Protection (Bidirectional via allowlist)
        const isTreasuryInvolved =
            source.accountType === ACCOUNT_TYPES.TREASURY ||
            destination.accountType === ACCOUNT_TYPES.TREASURY;

        if (isTreasuryInvolved) {
            const ALLOWED_TREASURY_PARTNERS = [
                ACCOUNT_TYPES.FUNDING,
                ACCOUNT_TYPES.SYSTEM,
                ACCOUNT_TYPES.TREASURY,
            ];

            if (
                !ALLOWED_TREASURY_PARTNERS.includes(source.accountType as any) ||
                !ALLOWED_TREASURY_PARTNERS.includes(destination.accountType as any)
            ) {
                throw new ForbiddenError(
                    "Treasury accounts can only interact with Funding, System, or other Treasury accounts"
                );
            }
        }

        // Balance Check (Atomic inside repo, but we fail fast here too)
        if (source.balanceCents < input.amountCents) {
            throw new BadRequestError("Insufficient funds");
        }

        // Generate IDs and timestamps (Rule 78)
        const now = new Date();
        const txId = `tx_${nanoid()}`;
        const debitLineId = `txl_${nanoid()}`;
        const creditLineId = `txl_${nanoid()}`;

        // Validate at Service Boundary (Rule 85)
        const repoInput = createTransactionRepoInputSchema.parse({
            ...input,
            id: txId,
            transactionDate: input.transactionDate ?? now,
            createdAt: now,
            debitLineId,
            creditLineId,
        });

        return this.transactionsRepo.insert(repoInput);
    }

    /**
     * Deactivates an account to prevent further transactions.
     */
    async deactivateAccount(accountId: string) {
        const now = new Date();
        const account = await this.accountsRepo.deactivate(accountId, now);
        return this.assertExists(account, `Account ${accountId} not found`);
    }
}
