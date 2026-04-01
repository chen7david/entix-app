import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { FinancialBaseService } from "./financial-base.service";

/**
 * AdminFinancialService manages all platform-level treasury operations.
 * It is not restricted by ownerType and has full authority to credit or debit
 * any account in the system from the platform treasury.
 */
export class AdminFinancialService extends FinancialBaseService {
    constructor(
        protected readonly db: AppDb,
        protected readonly accountsRepo: FinancialAccountsRepository,
        protected readonly transactionsRepo: FinancialTransactionsRepository
    ) {
        super(db, accountsRepo, transactionsRepo);
    }

    /**
     * Admin credit: moves money FROM the platform treasury account
     * TO a user or org account. Used for deposits, rewards, adjustments.
     */
    async adminCredit(input: {
        organizationId: string;
        categoryId: string;
        platformTreasuryAccountId: string;
        destinationAccountId: string;
        currencyId: string;
        amountCents: number;
        description?: string;
    }) {
        return this.executeTransaction({
            organizationId: input.organizationId,
            categoryId: input.categoryId,
            sourceAccountId: input.platformTreasuryAccountId,
            destinationAccountId: input.destinationAccountId,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            description: input.description,
            transactionDate: new Date(),
        });
    }

    /**
     * Admin debit: moves money FROM a user or org account
     * TO the platform treasury. Used for fees, chargebacks, penalties.
     */
    async adminDebit(input: {
        organizationId: string;
        categoryId: string;
        sourceAccountId: string;
        platformTreasuryAccountId: string;
        currencyId: string;
        amountCents: number;
        description?: string;
    }) {
        return this.executeTransaction({
            organizationId: input.organizationId,
            categoryId: input.categoryId,
            sourceAccountId: input.sourceAccountId,
            destinationAccountId: input.platformTreasuryAccountId,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            description: input.description,
            transactionDate: new Date(),
        });
    }

    /**
     * Returns the current balance of all platform treasury accounts.
     */
    async getTreasuryBalance() {
        const allAccounts = await this.accountsRepo.findActiveByOwner("platform", "org");
        return allAccounts.filter((a) => a.id.startsWith("facc_treasury_"));
    }

    /**
     * Lists all active accounts for any given organization.
     * This bypasses the typical "user vs org" scope checks and is intended
     * for super-admin views (e.g., FinancialManagementPage).
     */
    /**
     * Lists all active accounts for any given organization.
     * This bypasses the typical "user vs org" scope checks and is intended
     * for super-admin views (e.g., FinancialManagementPage).
     */
    async getAnyOrgAccounts(orgId: string) {
        const accounts = await this.accountsRepo.findActiveByOwner(orgId, "org");
        return accounts.filter((a) => a.isFundingAccount === true);
    }
    /**
     * Updates the name/label of any financial account.
     */
    async updateAccount(id: string, name: string) {
        return this.accountsRepo.updateName(id, name);
    }
    /**
     * Archives a financial account.
     * Logic: Only allowed if the balance is zero to prevent hidden funds.
     */
    async archiveAccount(id: string) {
        const account = await this.accountsRepo.findById(id);
        if (!account) throw new Error("Account not found");
        if (account.balanceCents !== 0) {
            throw new Error("Cannot archive an account with a non-zero balance. Please transfer funds out first.");
        }
        return this.accountsRepo.archive(id);
    }
}
