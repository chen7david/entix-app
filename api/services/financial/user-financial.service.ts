import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import type { FinancialOrgSettingsRepository } from "@api/repositories/financial/financial-org-settings.repository";
import type {
    FinancialTransactionsRepository,
    PaginationInput,
} from "@api/repositories/financial/financial-transactions.repository";
import { FinancialBaseService } from "./financial-base.service";

/**
 * UserFinancialService manages all personal user wallet balances and logic.
 * It strictly enforces 'ownerType: "user"' and handles wallet provisioning.
 */
export class UserFinancialService extends FinancialBaseService {
    constructor(
        protected readonly db: AppDb,
        protected readonly accountsRepo: FinancialAccountsRepository,
        protected readonly transactionsRepo: FinancialTransactionsRepository,
        private readonly currenciesRepo: FinancialCurrenciesRepository,
        private readonly orgSettingsRepo: FinancialOrgSettingsRepository
    ) {
        super(db, accountsRepo, transactionsRepo);
    }

    /**
     * Returns personal wallet summary for a user within a specific organization.
     */
    async getUserSummary(userId: string, orgId: string) {
        const accounts = await this.accountsRepo.findActiveByOwner(userId, "user", orgId);
        return { accounts };
    }

    /**
     * Lists all active personal accounts for the user within a specific organization.
     */
    async listUserAccounts(userId: string, orgId: string) {
        return this.accountsRepo.findActiveByOwner(userId, "user", orgId);
    }

    /**
     * Creates a personal account for a user.
     * Default for users: allowMultiple = false unless explicitly requested.
     */
    async createUserAccount(
        input: {
            name: string;
            currencyId: string;
            userId: string;
            orgId: string;
        },
        options: { allowMultiple?: boolean } = { allowMultiple: false }
    ) {
        // Enforce Date+Currency uniqueness for the user within the organization
        const nameExists = await this.accountsRepo.existsByNameAndCurrency(
            input.userId,
            input.name,
            input.currencyId,
            input.orgId
        );
        if (nameExists) {
            return {
                success: false,
                alreadyExists: true,
                message: `An account named "${input.name}" in this currency already exists in this organization.`,
            };
        }

        // Enforce same-currency uniqueness for personal wallets within the organization
        if (!options.allowMultiple) {
            const currencyExists = await this.accountsRepo.existsByOwnerAndCurrency(
                input.userId,
                "user",
                input.currencyId,
                input.orgId
            );
            if (currencyExists) {
                return {
                    success: false,
                    alreadyExists: true,
                    message: "An active wallet for this currency already exists for this user.",
                };
            }
        }

        const account = await this.accountsRepo.create({
            ...input,
            ownerId: input.userId,
            ownerType: "user",
            organizationId: input.orgId,
        });

        return { success: true, account };
    }

    /**
     * Provisions default wallets for a user based on the organization's settings.
     */
    async provisionUserAccounts(userId: string, orgId: string) {
        const settings = await this.orgSettingsRepo.findOrCreate(orgId);
        const currenciesToProvision: string[] = JSON.parse(settings.autoProvisionCurrencies);

        // Fetch currency defaults
        const allCurrencies = await this.currenciesRepo.findActive();
        const currencyMap = new Map(allCurrencies.map((c) => [c.id, c.defaultAccountName]));

        const results = await Promise.all(
            currenciesToProvision.map(async (currencyId) => {
                const name = currencyMap.get(currencyId) || "Wallet";
                return this.createUserAccount({
                    name,
                    currencyId,
                    userId,
                    orgId,
                });
            })
        );

        return results;
    }

    /**
     * Returns personal transaction history for a user within a specific organization.
     */
    async getTransactionHistory(userId: string, orgId: string, pagination: PaginationInput) {
        const lines = await this.transactionsRepo.findByOwner(userId, "user", pagination, orgId);

        // Normalize TransactionLines into the flat Transaction DTO expected by the frontend
        const data = lines.map((line) => {
            const tx = line.transaction;
            return {
                id: tx.id,
                amountCents: tx.amountCents,
                status: tx.status,
                description: tx.description,
                transactionDate: tx.transactionDate,
                sourceAccount: tx.sourceAccount,
                destinationAccount: tx.destinationAccount,
                category: tx.category,
                currency: tx.currency,
            };
        });

        return {
            data,
            page: pagination.page,
            pageSize: pagination.pageSize,
        };
    }
}
