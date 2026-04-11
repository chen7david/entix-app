import { NotFoundError } from "@api/errors/app.error";
import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { ACCOUNT_TYPES, FINANCIAL_CATEGORIES } from "@shared";
import { FinancialBaseService } from "./financial-base.service";

/**
 * FinanceWalletService handles cross-domain wallet operations like session deductions.
 */
export class FinanceWalletService extends FinancialBaseService {
    constructor(
        protected readonly db: AppDb,
        protected readonly accountsRepo: FinancialAccountsRepository,
        protected readonly transactionsRepo: FinancialTransactionsRepository
    ) {
        super(db, accountsRepo, transactionsRepo);
    }

    /**
     * Deducts funds from a student's wallet and credits it to the organization's treasury.
     */
    async executeSessionDeduction(input: {
        userId: string;
        orgId: string;
        currencyId: string;
        amountCents: number;
        description: string;
        metadata?: any;
        sessionDate?: Date;
    }) {
        if (input.amountCents <= 0) {
            return; // No deduction needed for free sessions
        }

        // 1. Find the student's primary wallet for this currency
        const userAccounts = await this.accountsRepo.findActiveByOwner(
            input.userId,
            "user",
            input.orgId
        );
        const userWallet = userAccounts.find(
            (a) => a.currencyId === input.currencyId && a.accountType === ACCOUNT_TYPES.SAVINGS
        );

        if (!userWallet) {
            throw new NotFoundError(`No active ${input.currencyId} wallet found for student`);
        }

        // 2. Find the organization's treasury account for this currency
        const orgAccounts = await this.accountsRepo.findActiveByOwner(
            input.orgId,
            "org",
            input.orgId
        );
        const orgTreasury = orgAccounts.find(
            (a) => a.currencyId === input.currencyId && a.accountType === ACCOUNT_TYPES.TREASURY
        );

        if (!orgTreasury) {
            throw new NotFoundError(
                `No active ${input.currencyId} treasury account found for organization`
            );
        }

        // 3. Resolve Category for Session Fees
        const categoryId = FINANCIAL_CATEGORIES.SERVICE_FEE;

        // 4. Atomic Transaction via Base Service
        return this.executeTransaction({
            organizationId: input.orgId,
            categoryId,
            sourceAccountId: userWallet.id,
            destinationAccountId: orgTreasury.id,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            description: input.description,
            metadata: input.metadata,
            transactionDate: input.sessionDate,
        });
    }
}
