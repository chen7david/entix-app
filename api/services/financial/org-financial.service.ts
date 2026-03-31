import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import type {
    FinancialTransactionsRepository,
    PaginationInput,
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
        });
    }

    /**
     * Returns paginated transaction history for the organization.
     */
    async getTransactionHistory(orgId: string, pagination: PaginationInput) {
        return this.transactionsRepo.findByOrg(orgId, pagination);
    }

    /**
     * Internal status lookup for currencies.
     */
    async getOrgCurrencyStatus(orgId: string) {
        return this.currenciesRepo.findAllWithOrgStatus(orgId);
    }
}
