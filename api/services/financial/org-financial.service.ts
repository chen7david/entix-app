import { ConflictError, NotFoundError } from "@api/errors/app.error";
import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { createAccountRepoInputSchema } from "@shared/db/schema";
import type { TransactionFilters } from "@shared/schemas/dto/financial.dto";
import { nanoid } from "nanoid";
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
        if (original.status === "reversed") {
            throw new ConflictError("Transaction already reversed");
        }

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

        await this.transactionsRepo.reverse(txId);

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
     * Creates an organizational account with strict name+currency uniqueness.
     * Throws ConflictError if a duplicate exists (Rule 13/25) so the handler
     * stays clean (Rule 3) — no success/failure union returned.
     */
    async createOrgAccount(
        input: {
            name: string;
            currencyId: string;
            organizationId: string;
        },
        options: { allowMultiple?: boolean } = { allowMultiple: true }
    ) {
        const nameExists = await this.accountsRepo.existsByNameAndCurrency(
            input.organizationId,
            input.name,
            input.currencyId
        );
        if (nameExists) {
            throw new ConflictError(
                `An account named "${input.name}" in this currency already exists for this organization.`
            );
        }

        if (!options.allowMultiple) {
            const exists = await this.accountsRepo.existsByOwnerAndCurrency(
                input.organizationId,
                "org",
                input.currencyId
            );
            if (exists) {
                throw new ConflictError(
                    "An active account for this currency already exists. Set 'allowMultiple' to true for custom labeled accounts."
                );
            }
        }

        const now = new Date();
        const accountInput = createAccountRepoInputSchema.parse({
            id: `acc_${nanoid()}`,
            ownerId: input.organizationId,
            ownerType: "org",
            currencyId: input.currencyId,
            name: input.name,
            organizationId: null,
            isFundingAccount: false,
            accountType: "standard",
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
            id: `acc_${nanoid()}`,
            ownerId: orgId,
            ownerType: "org",
            currencyId,
            organizationId: null,
            name: `General Fund — ${target.code}`,
            isFundingAccount: true,
            accountType: "standard",
            createdAt: now,
            updatedAt: now,
        });

        const account = await this.accountsRepo.insert(accountInput);

        return this.assertExists(account, "Account not found");
    }

    /**
     * Returns paginated transaction history for the organization with filters.
     */
    async getTransactionHistory(orgId: string, filters: TransactionFilters) {
        return this.transactionsRepo.findByOrgId(orgId, filters);
    }

    /**
     * Internal status lookup for currencies.
     */
    async getOrgCurrencyStatus(orgId: string) {
        return this.currenciesRepo.findAllWithOrgStatus(orgId);
    }
}
