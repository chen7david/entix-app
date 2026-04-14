import { NotFoundError } from "@api/errors/app.error";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { ACCOUNT_TYPES, FINANCIAL_CATEGORIES } from "@shared";
import { FinancialBaseService } from "./financial-base.service";

/**
 * FinanceWalletService handles cross-domain wallet operations like session deductions.
 */
export class FinanceWalletService extends FinancialBaseService {
    constructor(
        protected readonly accountsRepo: FinancialAccountsRepository,
        protected readonly transactionsRepo: FinancialTransactionsRepository
    ) {
        super(accountsRepo, transactionsRepo);
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
     * Deducts funds from a student's wallet and credits it to the organization's treasury.
     *
     * @deprecated This method is not invoked by any active controller. New session billing
     * flows should use `SessionPaymentService.processSessionPayment()` instead.
     *
     * NOTE: This deprecation applies ONLY to `executeSessionDeduction`. The helper methods
     * `getWallet`, `getOrgTreasury`, and `getOrgFunding` remain active and are used by
     * other services (e.g., SessionScheduleService).
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

        const userWallet = await this.getWallet(input.userId, input.orgId, input.currencyId);
        const orgTreasury = await this.getOrgTreasury(input.orgId, input.currencyId);
        const categoryId = FINANCIAL_CATEGORIES.SERVICE_FEE;

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
