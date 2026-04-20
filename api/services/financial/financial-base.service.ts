import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors/app.error";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import {
    ACCOUNT_TYPES,
    generateOpaqueId,
    generateTransactionId,
    generateTransactionLineId,
} from "@shared";
import { createTransactionRepoInputSchema, financialAccounts } from "@shared/db/schema";
import { sql } from "drizzle-orm";
import { BaseService } from "../base.service";

/**
 * FinancialBaseService is the abstract foundation for all financial domain services.
 * It owns the core 'Double-Entry' transaction logic and shared validation guards.
 *
 * DO NOT instantiate this service directly.
 */
export abstract class FinancialBaseService extends BaseService {
    constructor(
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
        metadata?: any;
        transactionDate?: Date; // Optional, defaults to now
        idempotencyKey?: string | null;
    }): Promise<string> {
        // Fast-fail on obviously invalid input before any DB reads
        if (input.amountCents <= 0) {
            throw new BadRequestError("Transaction amount must be a positive integer.");
        }
        if (input.sourceAccountId === input.destinationAccountId) {
            throw new BadRequestError("Source and destination accounts must be different.");
        }

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

            const isServiceFeeToTreasury =
                input.categoryId === "fcat_service_fee" &&
                destination.accountType === ACCOUNT_TYPES.TREASURY;

            if (
                !isServiceFeeToTreasury &&
                (!ALLOWED_TREASURY_PARTNERS.includes(source.accountType as any) ||
                    !ALLOWED_TREASURY_PARTNERS.includes(destination.accountType as any))
            ) {
                throw new ForbiddenError(
                    "Treasury accounts can only interact with Funding, System, or other Treasury accounts"
                );
            }
        }

        // Balance Check (Atomic inside repo, but we fail fast here too)
        // Overdraft-aware: available = balance + overdraftLimit.
        // overdraftLimitCents null means no overdraft configured → treat as 0.
        const overdraftLimit = source.overdraftLimitCents ?? 0;
        const availableBalance = source.balanceCents + overdraftLimit;
        if (availableBalance < input.amountCents) {
            throw new BadRequestError(
                `Insufficient funds (balance: ${source.balanceCents}, overdraft: ${overdraftLimit}, required: ${input.amountCents})`
            );
        }

        // Ledger batch ties header + debit/credit lines + idempotency in one atomic batch — ids must exist before `transactionsRepo.insert`.
        const now = new Date();
        const txId = generateTransactionId();
        const debitLineId = generateTransactionLineId();
        const creditLineId = generateTransactionLineId();

        // Validate at Service Boundary (Rule 85)
        const repoInput = createTransactionRepoInputSchema.parse({
            id: txId,
            organizationId: input.organizationId,
            categoryId: input.categoryId,
            sourceAccountId: input.sourceAccountId,
            destinationAccountId: input.destinationAccountId,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            description: input.description,
            metadata: input.metadata,
            transactionDate: input.transactionDate ?? now,
            createdAt: now,
            debitLineId,
            creditLineId,
            // Always populate — repository needs this for the DB unique index guard.
            // If no key was provided by the caller, generate a one-off nanoid.
            // This means non-idempotent callers are safe but won't get dedup replay.
            idempotencyKey: input.idempotencyKey ?? generateOpaqueId(),
        });

        // 1. Guard Condition (shared across all statements in the batch)
        const balanceGuard = sql`${financialAccounts.id} = ${input.sourceAccountId} AND ${financialAccounts.isActive} IS NOT 0 AND ${financialAccounts.balanceCents} + ${overdraftLimit} >= ${input.amountCents}`;

        return this.transactionsRepo.insert(repoInput, balanceGuard);
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
