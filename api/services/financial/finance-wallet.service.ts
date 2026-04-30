import { NotFoundError } from "@api/errors/app.error";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import type { FinancialOrgSettingsRepository } from "@api/repositories/financial/financial-org-settings.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import {
    ACCOUNT_TYPES,
    FINANCIAL_CATEGORIES,
    FINANCIAL_CURRENCIES,
    generateAccountId,
} from "@shared";
import { FinancialBaseService } from "./financial-base.service";

/**
 * FinanceWalletService handles cross-domain wallet operations like session deductions.
 */
export class FinanceWalletService extends FinancialBaseService {
    constructor(
        protected readonly accountsRepo: FinancialAccountsRepository,
        protected readonly transactionsRepo: FinancialTransactionsRepository,
        private readonly currenciesRepo: FinancialCurrenciesRepository,
        private readonly orgSettingsRepo: FinancialOrgSettingsRepository
    ) {
        super(accountsRepo, transactionsRepo);
    }

    async provisionWalletIfNotExists(userId: string, orgId: string) {
        const settings = await this.orgSettingsRepo.findByOrgId(orgId);
        const fallbackCurrencies: string[] = [FINANCIAL_CURRENCIES.ETD, FINANCIAL_CURRENCIES.CNY];
        let currenciesToProvision: string[] = fallbackCurrencies;
        if (settings) {
            try {
                const parsed = JSON.parse(settings.autoProvisionCurrencies) as string[];
                if (Array.isArray(parsed) && parsed.length > 0) {
                    currenciesToProvision = parsed;
                }
            } catch {
                currenciesToProvision = fallbackCurrencies;
            }
        }

        const allCurrencies = await this.currenciesRepo.findAllActive();
        const defaultNameByCurrency = new Map(
            allCurrencies.map((currency) => [currency.id, currency.defaultAccountName])
        );

        let created = 0;
        for (const currencyId of currenciesToProvision) {
            const exists = await this.accountsRepo.existsByOwnerAndCurrency(
                userId,
                "user",
                currencyId,
                orgId
            );
            if (exists) continue;

            await this.accountsRepo.insert({
                id: generateAccountId(),
                name: defaultNameByCurrency.get(currencyId) ?? "Wallet",
                currencyId,
                ownerId: userId,
                ownerType: "user",
                organizationId: orgId,
                accountType: ACCOUNT_TYPES.SAVINGS,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            created++;
        }

        return { created };
    }
    /**
     * Gets a specific wallet account for a user in a given currency.
     */
    async getWallet(userId: string, orgId: string, currencyId: string) {
        const userAccounts = await this.accountsRepo.findActiveByOwner(userId, "user", orgId);
        const wallet = userAccounts.find(
            (a) => a.currencyId === currencyId && a.accountType === ACCOUNT_TYPES.SAVINGS
        );

        if (!wallet) {
            throw new NotFoundError(`No active ${currencyId} wallet found for student`);
        }

        return wallet;
    }
    /**
     * Gets an organization's treasury account for a given currency.
     */
    async getOrgTreasury(orgId: string, currencyId: string) {
        const orgAccounts = await this.accountsRepo.findActiveByOwner(orgId, "org", orgId);
        const orgTreasury = orgAccounts.find(
            (a) => a.currencyId === currencyId && a.accountType === ACCOUNT_TYPES.TREASURY
        );

        if (!orgTreasury) {
            throw new NotFoundError(
                `No active ${currencyId} treasury account found for organization`
            );
        }

        return orgTreasury;
    }

    /**
     * Gets an organization's funding account for a given currency.
     * This is the correct destination for session fee payments from student wallets.
     */
    async getOrgFunding(orgId: string, currencyId: string) {
        const orgAccounts = await this.accountsRepo.findActiveByOwner(orgId, "org", orgId);
        const funding = orgAccounts.find(
            (a) => a.currencyId === currencyId && a.accountType === ACCOUNT_TYPES.FUNDING
        );

        if (!funding) {
            throw new NotFoundError(
                `No active ${currencyId} funding account found for organization`
            );
        }

        return funding;
    }

    /**
     * Deducts funds from a student's wallet and credits it to the organization's treasury.
     *
     * @deprecated This method is not invoked by any active controller. New session billing
     * flows should use `SessionPaymentService.processSessionPayment()` instead.
     *
     * NOTE: This deprecation applies ONLY to `executeSessionDeduction`. The helper methods
     * `getWallet`, `getOrgTreasury`, and `getOrgFunding` remain active and are used by
     * other services (e.g., SessionScheduleService).
     */
    async executeSessionDeduction(input: {
        userId: string;
        orgId: string;
        currencyId: string;
        amountCents: number;
        description: string;
        metadata?: any;
        sessionDate?: Date;
    }) {
        if (input.amountCents <= 0) {
            return; // No deduction needed for free sessions
        }

        const userWallet = await this.getWallet(input.userId, input.orgId, input.currencyId);
        const orgFunding = await this.getOrgFunding(input.orgId, input.currencyId);
        const categoryId = FINANCIAL_CATEGORIES.CASH_DEPOSIT;

        return this.executeTransaction({
            organizationId: input.orgId,
            categoryId,
            sourceAccountId: userWallet.id,
            destinationAccountId: orgFunding.id,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            description: input.description,
            metadata: input.metadata,
            transactionDate: input.sessionDate,
        });
    }
}
