import { BadRequestError, ConflictError, NotFoundError } from "@api/errors/app.error";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import {
    buildTransactionCursor,
    type FinancialTransactionsRepository,
    parseTransactionCursor,
} from "@api/repositories/financial/financial-transactions.repository";
import {
    ACCOUNT_TYPES,
    FINANCIAL_CATEGORIES,
    type FinancialAccount,
    generateAccountId,
    type TransactionFilters,
} from "@shared";
import { createAccountRepoInputSchema } from "@shared/db/schema";
import { FinancialBaseService } from "./financial-base.service";

/**
 * OrgFinancialService manages all organization-level treasury operations.
 * It strictly enforces 'ownerType: "org"' and handles multi-account creation
 * and internal transfers within an organization.
 */
export class OrgFinancialService extends FinancialBaseService {
    constructor(
        protected readonly accountsRepo: FinancialAccountsRepository,
        protected readonly transactionsRepo: FinancialTransactionsRepository,
        private readonly currenciesRepo: FinancialCurrenciesRepository
    ) {
        super(accountsRepo, transactionsRepo);
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
        // Use shared logic from FinancialBaseService to enforce guards
        return this.executeTransaction({
            ...input,
            transactionDate: new Date(),
        });
    }

    /**
     * Reverses a completed transaction by creating a mirror rebuttal.
     */
    async reverseTransaction(txId: string, organizationId: string, reason: string) {
        const original = await this.transactionsRepo.findById(txId);
        if (!original) throw new NotFoundError("Transaction not found");
        if (original.status === "reversed") throw new ConflictError("Transaction already reversed");

        // Execute mirror transaction (swap source and destination)
        const reversalTxId = await this.executeTransaction({
            organizationId,
            categoryId: FINANCIAL_CATEGORIES.REFUND,
            sourceAccountId: original.destinationAccountId,
            destinationAccountId: original.sourceAccountId,
            currencyId: original.currencyId,
            amountCents: original.amountCents,
            description: `Reversal of ${txId}: ${reason}`,
            transactionDate: new Date(),
        });

        // Mark original as officially reversed in the database
        await this.transactionsRepo.reverse(txId);

        return reversalTxId;
    }

    /**
     * Returns all active accounts for an organization.
     */
    async getOrgSummary(orgId: string) {
        const accounts = await this.accountsRepo.findActiveByOwner(orgId, "org", orgId);
        return { accounts };
    }

    /**
     * Lists all active financial accounts for the organization.
     */
    async listOrgAccounts(orgId: string) {
        return this.accountsRepo.findActiveByOwner(orgId, "org", orgId);
    }

    /**
     * Creates an organizational account with strict name uniqueness.
     * Throws ConflictError if duplicate exists.
     */
    async createOrgAccount(
        input: {
            name: string;
            currencyId: string;
            organizationId: string;
        },
        options: { allowMultiple?: boolean } = { allowMultiple: true }
    ): Promise<FinancialAccount> {
        // 1. Name + Currency Uniqueness
        const nameExists = await this.accountsRepo.existsByNameAndCurrency(
            input.organizationId,
            input.name,
            input.currencyId,
            input.organizationId
        );
        if (nameExists) {
            throw new ConflictError(
                `An account named "${input.name}" in this currency already exists for this organization.`
            );
        }

        // 2. Currency Uniqueness (if not allowing multiple)
        if (!options.allowMultiple) {
            const exists = await this.accountsRepo.existsByOwnerAndCurrency(
                input.organizationId,
                "org",
                input.currencyId,
                input.organizationId
            );
            if (exists) {
                throw new ConflictError(
                    "An active account for this currency already exists. Set 'allowMultiple' to true for custom labeled accounts."
                );
            }
        }

        const now = new Date();
        const accountInput = createAccountRepoInputSchema.parse({
            id: generateAccountId(),
            ownerId: input.organizationId,
            ownerType: "org",
            currencyId: input.currencyId,
            name: input.name,
            organizationId: input.organizationId, // All accounts are org-scoped
            accountType: ACCOUNT_TYPES.SAVINGS,
            createdAt: now,
            updatedAt: now,
        });

        return this.accountsRepo.insert(accountInput);
    }

    /**
     * Activates a currency by creating its first 'General Fund' account.
     */
    async activateCurrency(orgId: string, currencyId: string) {
        const currencies = await this.currenciesRepo.findAllWithOrgStatus(orgId);
        const target = currencies.find((c) => c.id === currencyId);

        if (!target) throw new NotFoundError("Currency not found");
        if (target.isActivated) {
            throw new ConflictError(`Currency ${target.code} is already activated`);
        }

        const now = new Date();
        const accountInput = createAccountRepoInputSchema.parse({
            id: generateAccountId(),
            ownerId: orgId,
            ownerType: "org",
            currencyId,
            organizationId: orgId,
            name: `General Fund — ${target.code}`,
            accountType: ACCOUNT_TYPES.FUNDING,
            createdAt: now,
            updatedAt: now,
        });

        const account = await this.accountsRepo.insert(accountInput);

        return this.assertExists(account, "Account not found");
    }

    async getTransactionHistory(orgId: string, filters: TransactionFilters) {
        if (filters.cursor && !parseTransactionCursor(filters.cursor)) {
            throw new BadRequestError("Invalid pagination cursor");
        }
        const limit = filters.limit ?? 20;
        const transactions = await this.transactionsRepo.findByOrgId(orgId, filters);
        const nextCursor = buildTransactionCursor(transactions, limit);
        return {
            data: transactions,
            nextCursor,
        };
    }

    /**
     * Internal status lookup for currencies.
     */
    async getOrgCurrencyStatus(orgId: string) {
        return this.currenciesRepo.findAllWithOrgStatus(orgId);
    }
}
