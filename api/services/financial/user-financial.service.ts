import { BadRequestError, ConflictError, InternalServerError } from "@api/errors/app.error";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import type { FinancialOrgSettingsRepository } from "@api/repositories/financial/financial-org-settings.repository";
import {
    buildTransactionCursor,
    type FinancialTransactionsRepository,
    parseTransactionCursor,
} from "@api/repositories/financial/financial-transactions.repository";
import { ACCOUNT_TYPES, type FinancialAccount, generateAccountId } from "@shared";
import { createAccountRepoInputSchema } from "@shared/db/schema";
import { FinancialBaseService } from "./financial-base.service";

/**
 * UserFinancialService manages all personal user wallet balances and logic.
 * It strictly enforces 'ownerType: "user"' and handles wallet provisioning.
 */
export class UserFinancialService extends FinancialBaseService {
    constructor(
        protected readonly accountsRepo: FinancialAccountsRepository,
        protected readonly transactionsRepo: FinancialTransactionsRepository,
        private readonly currenciesRepo: FinancialCurrenciesRepository,
        private readonly orgSettingsRepo: FinancialOrgSettingsRepository
    ) {
        super(accountsRepo, transactionsRepo);
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
     * Throws ConflictError if duplicate exists.
     */
    async createUserAccount(
        input: {
            name: string;
            currencyId: string;
            userId: string;
            orgId: string;
        },
        options: { allowMultiple?: boolean } = { allowMultiple: false }
    ): Promise<FinancialAccount> {
        // Enforce Date+Currency uniqueness for the user within the organization
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

        // Enforce same-currency uniqueness for personal wallets within the organization
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
            accountType: ACCOUNT_TYPES.SAVINGS,
        });

        return this.accountsRepo.insert(accountInput);
    }

    /**
     * Ensures org financial settings exist. New row PK comes from schema default (no batch FK here).
     */
    private async ensureOrgFinancialSettings(organizationId: string) {
        const existing = await this.orgSettingsRepo.findByOrgId(organizationId);
        if (existing) {
            return existing;
        }
        const created = await this.orgSettingsRepo.insertDefaults(organizationId);
        if (!created) {
            throw new InternalServerError("Failed to initialize organization financial settings");
        }
        return created;
    }

    /**
     * Provisions default wallets for a user based on the organization's settings.
     */
    async provisionUserAccounts(userId: string, orgId: string) {
        const settings = await this.ensureOrgFinancialSettings(orgId);
        const currenciesToProvision: string[] = JSON.parse(settings.autoProvisionCurrencies);

        // Fetch currency defaults
        const allCurrencies = await this.currenciesRepo.findAllActive();
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
     * Returns personal transaction history for a user within a specific organization with cursor support.
     */
    async getTransactionHistory(
        userId: string,
        orgId: string,
        pagination: { cursor?: string; limit: number },
        filters: any = {}
    ) {
        if (pagination.cursor && !parseTransactionCursor(pagination.cursor)) {
            throw new BadRequestError("Invalid pagination cursor");
        }
        const lines = await this.transactionsRepo.findByOwnerId(
            userId,
            "user",
            { ...pagination, ...filters },
            orgId
        );

        // Normalize TransactionLines into the flat Transaction DTO expected by the frontend
        const data = lines.map((line) => {
            const tx = line.transaction;
            const direction = line.direction; // 'debit' | 'credit'

            // Resolve counterparty based on direction
            const counterparty =
                direction === "debit" ? (tx as any).destinationAccount : (tx as any).sourceAccount;

            return {
                id: tx.id,
                organizationId: tx.organizationId,
                categoryId: tx.categoryId,
                sourceAccountId: tx.sourceAccountId,
                destinationAccountId: tx.destinationAccountId,
                currencyId: tx.currencyId,
                amountCents: tx.amountCents,
                status: tx.status,
                description: tx.description,
                transactionDate: tx.transactionDate,
                createdAt: tx.createdAt,
                direction,
                counterpartyName: counterparty?.ownerName || counterparty?.name || "Unknown",
                category: (tx as any).category,
                currency: (tx as any).currency,
                sourceAccount: (tx as any).sourceAccount,
                destinationAccount: (tx as any).destinationAccount,
                account: line.account,
            };
        });

        // Build next-page cursor from results
        const cursorItems = lines.map((l) => ({
            transactionDate: l.transaction.transactionDate,
            id: l.id,
        }));
        const nextCursor = buildTransactionCursor(cursorItems, pagination.limit);

        return {
            data,
            nextCursor,
        };
    }
}
