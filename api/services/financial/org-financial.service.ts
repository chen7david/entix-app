import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import type {
    FinancialTransactionsRepository,
    TransactionFilters,
} from "@api/repositories/financial/financial-transactions.repository";
import { FinancialBaseService } from "./financial-base.service";

/**
 * OrgFinancialService manages all organization-level treasury operations.
 * It strictly enforces 'ownerType: "org"' and handles multi-account creation
 * and internal transfers within an organization.
 */
export class OrgFinancialService extends FinancialBaseService {
    constructor(
        protected readonly db: AppDb,
        protected readonly accountsRepo: FinancialAccountsRepository,
        protected readonly transactionsRepo: FinancialTransactionsRepository,
        private readonly currenciesRepo: FinancialCurrenciesRepository
    ) {
        super(db, accountsRepo, transactionsRepo);
    }

    /**
     * Executes an internal transfer between two or more organizational accounts.
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
        // Enforce shared transaction logic from base
        return this.transactionsRepo.executeTransaction({
            ...input,
            transactionDate: new Date(),
        });
    }

    /**
     * Reverses a completed transaction by creating a mirror rebuttal.
     */
    async reverseTransaction(txId: string, organizationId: string, reason: string) {
        const original = await this.transactionsRepo.findById(txId);
        if (!original) throw new Error("Transaction not found");
        if (original.status === "reversed") throw new Error("Transaction already reversed");

        // Execute mirror transaction (swap source and destination)
        const reversalTxId = await this.executeTransaction({
            organizationId,
            categoryId: "fcat_refund",
            sourceAccountId: original.destinationAccountId,
            destinationAccountId: original.sourceAccountId,
            currencyId: original.currencyId,
            amountCents: original.amountCents,
            description: `Reversal of ${txId}: ${reason}`,
            transactionDate: new Date(),
        });

        // Mark original as officially reversed in the database
        await this.transactionsRepo.markReversed(txId);

        return reversalTxId;
    }

    /**
     * Returns all active accounts for an organization.
     */
    async getOrgSummary(orgId: string) {
        const accounts = await this.accountsRepo.findActiveByOwner(orgId, "org");
        return { accounts };
    }

    /**
     * Lists all active financial accounts for the organization.
     */
    async listOrgAccounts(orgId: string) {
        return this.accountsRepo.findActiveByOwner(orgId, "org");
    }

    /**
     * Creates an organizational account with strict name uniqueness.
     */
    async createOrgAccount(
        input: {
            name: string;
            currencyId: string;
            organizationId: string;
        },
        options: { allowMultiple?: boolean } = { allowMultiple: true }
    ) {
        // 1. Name + Currency Uniqueness
        const nameExists = await this.accountsRepo.existsByNameAndCurrency(
            input.organizationId,
            input.name,
            input.currencyId
        );
        if (nameExists) {
            return {
                success: false,
                alreadyExists: true,
                message: `An account named "${input.name}" in this currency already exists for this organization.`,
            };
        }

        // 2. Currency Uniqueness (if not allowing multiple)
        if (!options.allowMultiple) {
            const exists = await this.accountsRepo.existsByOwnerAndCurrency(
                input.organizationId,
                "org",
                input.currencyId
            );
            if (exists) {
                return {
                    success: false,
                    alreadyExists: true,
                    message:
                        "An active account for this currency already exists. Set 'allowMultiple' to true for custom labeled accounts.",
                };
            }
        }

        const account = await this.accountsRepo.create({
            ownerId: input.organizationId,
            ownerType: "org",
            currencyId: input.currencyId,
            name: input.name,
            organizationId: null, // Scoped accounts are only for users
            isFundingAccount: false, // Custom accounts are never funding accounts
        });

        return { success: true, account };
    }

    /**
     * Activates a currency by creating its first 'General Fund' account.
     */
    async activateCurrency(orgId: string, currencyId: string) {
        const currencies = await this.currenciesRepo.findAllWithOrgStatus(orgId);
        const target = currencies.find((c) => c.id === currencyId);

        if (!target) throw new Error("Currency not found");
        if (target.isActivated) {
            throw new Error(`Currency ${target.code} is already activated`);
        }

        return this.accountsRepo.create({
            ownerId: orgId,
            ownerType: "org",
            currencyId,
            organizationId: null,
            name: `General Fund — ${target.code}`,
            isFundingAccount: true, // Auto-set at activation
        });
    }

    /**
     * Returns paginated transaction history for the organization with filters.
     */
    async getTransactionHistory(orgId: string, filters: TransactionFilters) {
        return this.transactionsRepo.findByOrg(orgId, filters);
    }

    /**
     * Internal status lookup for currencies.
     */
    async getOrgCurrencyStatus(orgId: string) {
        return this.currenciesRepo.findAllWithOrgStatus(orgId);
    }
}
