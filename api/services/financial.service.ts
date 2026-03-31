import type { AppDb } from "@api/factories/db.factory";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type {
    CreateTransactionInput,
    FinancialTransactionsRepository,
    PaginationInput,
} from "@api/repositories/financial/financial-transactions.repository";
import { BaseService } from "./base.service";

/**
 * FinancialService is the ONLY entry point for any money movement.
 * Controllers MUST NOT call repository write methods directly.
 *
 * All balance mutations use db.batch() for D1-safe atomicity.
 */
export class FinancialService extends BaseService {
    constructor(
        private readonly db: AppDb,
        private readonly accountsRepo: FinancialAccountsRepository,
        private readonly transactionsRepo: FinancialTransactionsRepository
    ) {
        super();
    }

    /**
     * Executes a double-entry transaction atomically using db.batch().
     * Debit source, credit destination, insert transaction record,
     * insert debit + credit lines — all in one D1 batch.
     */
    async executeTransaction(input: CreateTransactionInput) {
        const { txId, statements } = this.transactionsRepo.prepareInsertStatements(input);

        // Note: Casting to any because Drizzle's D1 types are sometimes
        // strict about the exact shape of BatchItem.
        await this.db.batch(statements as any);

        return txId;
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
}
