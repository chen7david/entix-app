import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { getTreasuryAccountId } from "@shared";
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
     * Returns the current balance of the platform treasury account for a given currency.
     */
    async getTreasuryBalance(currencyId: string = "fcur_usd") {
        const treasuryId = getTreasuryAccountId(currencyId);
        const treasury = this.assertExists(
            await this.accountsRepo.findById(treasuryId),
            `Platform treasury account for ${currencyId} not found`
        );

        return {
            balanceCents: treasury.balanceCents,
            balanceFormatted: `${(treasury.balanceCents / 100).toLocaleString("en-US", {
                minimumFractionDigits: 2,
            })}`,
        };
    }

    /**
     * Lists all active accounts for any given organization.
     * This bypasses the typical "user vs org" scope checks and is intended
     * for super-admin views (e.g., FinancialManagementPage).
     */
    async getAnyOrgAccounts(orgId: string) {
        return this.accountsRepo.findActiveByOwner(orgId, "org");
    }
}
