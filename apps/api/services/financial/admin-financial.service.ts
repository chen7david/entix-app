import { BadRequestError, NotFoundError } from "@api/errors/app.error";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import {
    ACCOUNT_TYPES,
    type EnsureFundingAccountRequest,
    FINANCIAL_CURRENCY_CONFIG,
    generateAccountId,
} from "@shared";
import { FinancialBaseService } from "./financial-base.service";

/**
 * AdminFinancialService manages all platform-level treasury operations.
 * It is not restricted by ownerType and has full authority to credit or debit
 * any account in the system from the platform treasury.
 */
export class AdminFinancialService extends FinancialBaseService {
    constructor(
        protected readonly accountsRepo: FinancialAccountsRepository,
        protected readonly transactionsRepo: FinancialTransactionsRepository
    ) {
        super(accountsRepo, transactionsRepo);
    }

    async adminCredit(input: {
        organizationId: string;
        categoryId: string;
        platformTreasuryAccountId: string;
        destinationAccountId: string;
        currencyId: string;
        amountCents: number;
        description?: string;
        idempotencyKey?: string | null;
    }) {
        return this.executeTransaction({
            organizationId: input.organizationId,
            categoryId: input.categoryId,
            sourceAccountId: input.platformTreasuryAccountId,
            destinationAccountId: input.destinationAccountId,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            description: input.description,
            idempotencyKey: input.idempotencyKey,
            transactionDate: new Date(),
        });
    }

    async adminDebit(input: {
        organizationId: string;
        categoryId: string;
        sourceAccountId: string;
        platformTreasuryAccountId: string;
        currencyId: string;
        amountCents: number;
        description?: string;
        idempotencyKey?: string | null;
    }) {
        return this.executeTransaction({
            organizationId: input.organizationId,
            categoryId: input.categoryId,
            sourceAccountId: input.sourceAccountId,
            destinationAccountId: input.platformTreasuryAccountId,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            description: input.description,
            idempotencyKey: input.idempotencyKey,
            transactionDate: new Date(),
        });
    }

    /**
     * Returns the current balance of all platform treasury accounts.
     */
    async getTreasuryBalance() {
        const allAccounts = await this.accountsRepo.findActiveByOwner(
            "platform",
            "org",
            "platform"
        );
        return allAccounts.filter((a) => a.accountType === ACCOUNT_TYPES.TREASURY);
    }

    /**
     * Returns all organization accounts in the system (excluding platform).
     */
    async getAllManagedAccounts() {
        return this.accountsRepo.findActiveByOwnerType("org");
    }

    /**
     * Returns active accounts for a specific organization.
     */
    async getAnyOrgAccounts(orgId: string) {
        const accounts = await this.accountsRepo.findActiveByOwner(orgId, "org", orgId);
        return accounts;
    }

    /**
     * Idempotent logic to ensure an organization has a funding account for a specific currency.
     */
    async ensureOrgFundingAccount(input: EnsureFundingAccountRequest) {
        const accounts = await this.accountsRepo.findActiveByOwner(
            input.organizationId,
            "org",
            input.organizationId
        );
        const existing = accounts.find(
            (a) => a.currencyId === input.currencyId && a.accountType === ACCOUNT_TYPES.FUNDING
        );

        if (existing) {
            return existing;
        }

        const currency =
            FINANCIAL_CURRENCY_CONFIG[input.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG];
        if (!currency) {
            throw new BadRequestError(`Invalid currency ID: ${input.currencyId}`);
        }

        const newAccount = await this.accountsRepo.insert({
            id: generateAccountId(),
            organizationId: input.organizationId,
            ownerId: input.organizationId,
            ownerType: "org",
            currencyId: input.currencyId,
            name: `General Fund — ${currency.code}`,
            accountType: ACCOUNT_TYPES.FUNDING,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return newAccount;
    }

    /**
     * Updates the name/label of any financial account.
     */
    /**
     * Updates the name/label and/or overdraft limit of any financial account.
     */
    async updateAccount(id: string, name?: string, overdraftLimitCents?: number | null) {
        const account = await this.accountsRepo.findById(id);
        this.assertExists(account, "Account not found");
        const now = new Date();

        let updated = account;

        if (name !== undefined) {
            const res = await this.accountsRepo.updateName(id, name, now);
            updated = this.assertExists(res, "Account not found");
        }

        if (overdraftLimitCents !== undefined) {
            const res = await this.accountsRepo.updateOverdraftLimit(id, overdraftLimitCents, now);
            updated = this.assertExists(res, "Account not found");
        }

        // Return the most-recently updated snapshot.
        if (!updated) {
            throw new NotFoundError("Account not found");
        }
        return updated;
    }

    /**
     * Archives a financial account.
     * Logic: Only allowed if the balance is zero to prevent hidden funds.
     */
    async archiveAccount(id: string) {
        const account = await this.accountsRepo.findById(id);
        const verifiedAccount = this.assertExists(account, "Account not found");

        if (verifiedAccount.balanceCents !== 0) {
            throw new BadRequestError(
                `Cannot archive an account with a non-zero balance. Current balance: ${verifiedAccount.balanceCents} cents. Please transfer funds out first.`
            );
        }
        const now = new Date();
        return this.accountsRepo.archive(id, now);
    }
}
