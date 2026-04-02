import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import type { FinancialOrgSettingsRepository } from "@api/repositories/financial/financial-org-settings.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { ConflictError } from "@api/errors/app.error";
import { createAccountRepoInputSchema } from "@shared/db/schema";
import { generateAccountId } from "@shared/lib";
import type { CursorPaginationInput } from "@shared/schemas/dto/financial.dto";
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

    async getUserSummary(userId: string, orgId: string) {
        const accounts = await this.accountsRepo.findActiveByOwner(userId, "user", orgId);
        return { accounts };
    }

    async listUserAccounts(userId: string, orgId: string) {
        return this.accountsRepo.findActiveByOwner(userId, "user", orgId);
    }

    /**
     * Creates a personal account for a user.
     * Throws ConflictError on duplicate instead of returning a success/failure union (Rule 13/25).
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
        const nameExists = await this.accountsRepo.existsByNameAndCurrency(
            input.userId,
            input.name,
            input.currencyId,
            input.orgId
        );
        if (nameExists) {
            throw new ConflictError(
                `An account named "${input.name}" in this currency already exists in this organization.`
            );
        }

        if (!options.allowMultiple) {
            const currencyExists = await this.accountsRepo.existsByOwnerAndCurrency(
                input.userId,
                "user",
                input.currencyId,
                input.orgId
            );
            if (currencyExists) {
                throw new ConflictError(
                    "An active wallet for this currency already exists for this user."
                );
            }
        }

        const accountId = generateAccountId();
        const now = new Date();

        const accountInput = createAccountRepoInputSchema.parse({
            ...input,
            id: accountId,
            ownerId: input.userId,
            ownerType: "user",
            organizationId: input.orgId,
            createdAt: now,
            updatedAt: now,
            accountType: "standard",
        });

        return this.accountsRepo.insert(accountInput);
    }

    async provisionUserAccounts(userId: string, orgId: string) {
        const settings = await this.orgSettingsRepo.findOrCreate(orgId);
        const currenciesToProvision: string[] = JSON.parse(settings.autoProvisionCurrencies);

        const allCurrencies = await this.currenciesRepo.findAllActive();
        const currencyMap = new Map(allCurrencies.map((c) => [c.id, c.defaultAccountName]));

        const results = await Promise.all(
            currenciesToProvision.map(async (currencyId) => {
                const name = currencyMap.get(currencyId) || "Wallet";
                return this.createUserAccount({ name, currencyId, userId, orgId });
            })
        );

        return results;
    }

    /**
     * Returns cursor-paginated transaction history for a user within a specific organization.
     */
    async getTransactionHistory(userId: string, orgId: string, pagination: CursorPaginationInput) {
        return this.transactionsRepo.findByOwnerId(userId, "user", pagination, orgId);
    }
}
