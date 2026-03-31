import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import type {
    CreateTransactionInput,
    FinancialTransactionsRepository,
    PaginationInput,
} from "@api/repositories/financial/financial-transactions.repository";
import { PLATFORM_TREASURY_ACCOUNT_ID } from "@shared/db/seed/financial.seed";
import { BaseService } from "./base.service";

/**
 * FinancialService is the ONLY entry point for any money movement.
 * Controllers MUST NOT call repository write methods directly.
 *
 * All balance mutations use db.batch() for D1-safe atomicity.
 */
export class FinancialService extends BaseService {
    constructor(
        private readonly accountsRepo: FinancialAccountsRepository,
        private readonly transactionsRepo: FinancialTransactionsRepository,
        private readonly currenciesRepo: FinancialCurrenciesRepository
    ) {
        super();
    }

    /**
     * Executes a double-entry transaction atomically using db.batch().
     * Debit source, credit destination, insert transaction record,
     * insert debit + credit lines — all in one D1 batch.
     */
    async executeTransaction(input: CreateTransactionInput) {
        return this.transactionsRepo.executeTransaction(input);
    }

    /**
     * Internal transfer between two accounts within the same organization.
     */
    async executeTransfer(input: {
        organizationId: string;
        categoryId: string;
        sourceAccountId: string;
        destinationAccountId: string;
        currencyId: string;
        amountCents: number;
        description?: string;
    }) {
        return this.executeTransaction({
            ...input,
            transactionDate: new Date(),
        });
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
     * Returns all active accounts for an owner.
     */
    async getWalletSummary(ownerId: string, ownerType: "user" | "org") {
        const accounts = await this.accountsRepo.findActiveByOwner(ownerId, ownerType);
        return { accounts };
    }

    /**
     * Returns paginated transaction history for an organization.
     */
    async getTransactionHistory(organizationId: string, pagination: PaginationInput) {
        return this.transactionsRepo.findByOrg(organizationId, pagination);
    }

    async createAccount(input: {
        name: string;
        currencyId: string;
        ownerType: "user" | "org";
        ownerId: string;
    }) {
        return this.accountsRepo.create({
            ...input,
        });
    }

    async listAccounts(ownerId: string, ownerType: "user" | "org") {
        return this.accountsRepo.findActiveByOwner(ownerId, ownerType);
    }

    async deactivateAccount(accountId: string) {
        return this.accountsRepo.deactivate(accountId);
    }

    /**
     * Returns all platform currencies with activation status for this org.
     */
    async getOrgCurrencyStatus(orgId: string) {
        return this.currenciesRepo.findAllWithOrgStatus(orgId);
    }

    /**
     * Activates a currency for an org by creating a General Fund account.
     */
    async activateCurrency(orgId: string, currencyId: string) {
        const currencies = await this.currenciesRepo.findAllWithOrgStatus(orgId);
        const target = currencies.find((c) => c.id === currencyId);

        if (!target) throw new Error("Currency not found");
        if (target.isActivated) {
            throw new Error(`Currency ${target.code} is already activated for this organization`);
        }

        return this.accountsRepo.create({
            ownerId: orgId,
            ownerType: "org",
            currencyId,
            name: `General Fund — ${target.code}`,
        });
    }

    async getOrgAccounts(organizationId: string) {
        return this.accountsRepo.findActiveByOwner(organizationId, "org");
    }

    async getTreasuryBalance() {
        const treasury = this.assertExists(
            await this.accountsRepo.findById(PLATFORM_TREASURY_ACCOUNT_ID),
            "Platform treasury account not found"
        );

        return {
            balanceCents: treasury.balanceCents,
            balanceFormatted: `$${(treasury.balanceCents / 100).toLocaleString("en-US", {
                minimumFractionDigits: 2,
            })}`,
        };
    }
}
