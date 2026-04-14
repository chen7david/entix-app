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
     * Gets a specific wallet account for a user in a given currency.
     */
    async getWallet(userId: string, orgId: string, currencyId: string) {
        const userAccounts = await this.accountsRepo.findActiveByOwner(userId, "user", orgId);
        const wallet = userAccounts.find(
            (a) => a.currencyId === currencyId && a.accountType === ACCOUNT_TYPES.SAVINGS
        );

        if (!wallet) {
            throw new NotFoundError(`No active ${currencyId} wallet found for student`);
        }

        return wallet;
    }
    /**
     * Gets an organization's treasury account for a given currency.
     */
    async getOrgTreasury(orgId: string, currencyId: string) {
        const orgAccounts = await this.accountsRepo.findActiveByOwner(orgId, "org", orgId);
        const orgTreasury = orgAccounts.find(
            (a) => a.currencyId === currencyId && a.accountType === ACCOUNT_TYPES.TREASURY
        );

        if (!orgTreasury) {
            throw new NotFoundError(
                `No active ${currencyId} treasury account found for organization`
            );
        }

        return orgTreasury;
    }

    /**
     * Gets an organization's funding account for a given currency.
     * This is the correct destination for session fee payments from student wallets.
     */
    async getOrgFunding(orgId: string, currencyId: string) {
        const orgAccounts = await this.accountsRepo.findActiveByOwner(orgId, "org", orgId);
        const funding = orgAccounts.find(
            (a) => a.currencyId === currencyId && a.accountType === ACCOUNT_TYPES.FUNDING
        );

        if (!funding) {
            throw new NotFoundError(
                `No active ${currencyId} funding account found for organization`
            );
        }

        return funding;
    }

    /**
     * Deducts funds from a student's wallet and credits it to the organization's funding account.
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

        // 2. Find the organization's funding account for this currency
        const orgAccounts = await this.accountsRepo.findActiveByOwner(
            input.orgId,
            "org",
            input.orgId
        );
        const orgFundingAccount = orgAccounts.find(
            (a) => a.currencyId === input.currencyId && a.accountType === ACCOUNT_TYPES.FUNDING
        );

        if (!orgFundingAccount) {
            throw new NotFoundError(
                `No active ${input.currencyId} funding account found for organization`
            );
        }

        // 3. Resolve Category for Session Fees
        const categoryId = FINANCIAL_CATEGORIES.SERVICE_FEE;

        // 4. Atomic Transaction via Base Service
        return this.executeTransaction({
            organizationId: input.orgId,
            categoryId,
            sourceAccountId: userWallet.id,
            destinationAccountId: orgFundingAccount.id,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            description: input.description,
            metadata: input.metadata,
            transactionDate: input.sessionDate,
        });
    }
}
