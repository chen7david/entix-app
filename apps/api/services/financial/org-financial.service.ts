import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@api/errors/app.error";
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
    IdempotencyKeys,
    membershipHasFinanceAccess,
    type TransactionFilters,
} from "@shared";
import { createAccountRepoInputSchema } from "@shared/db/schema";
import { FinancialBaseService } from "./financial-base.service";

function actorCanMoveOrgFunds(
    membershipRole: string | undefined,
    isSuperAdmin: boolean | undefined
): boolean {
    if (isSuperAdmin) return true;
    return membershipHasFinanceAccess(membershipRole);
}

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
     * Executes an internal transfer between accounts in an organization.
     * Non–finance-staff actors may only move funds between their own user-owned accounts
     * (and still need the `finance:transfer` permission on the route).
     */
    async executeTransfer(input: {
        organizationId: string;
        categoryId: string;
        sourceAccountId: string;
        destinationAccountId: string;
        currencyId: string;
        amountCents: number;
        description?: string;
        idempotencyKey?: string | null;
        actorUserId: string;
        actorMembershipRole?: string;
        isSuperAdmin?: boolean;
    }) {
        if (!actorCanMoveOrgFunds(input.actorMembershipRole, input.isSuperAdmin)) {
            const [source, destination] = await Promise.all([
                this.accountsRepo.findById(input.sourceAccountId),
                this.accountsRepo.findById(input.destinationAccountId),
            ]);
            if (!source || !destination) {
                throw new NotFoundError("Source or destination account not found");
            }
            const owns = (account: typeof source) =>
                account.ownerType === "user" && account.ownerId === input.actorUserId;
            if (!owns(source) || !owns(destination)) {
                throw new ForbiddenError(
                    "You can only transfer between your own personal wallet accounts"
                );
            }
        }

        // Use shared logic from FinancialBaseService to enforce guards
        return this.executeTransaction({
            organizationId: input.organizationId,
            categoryId: input.categoryId,
            sourceAccountId: input.sourceAccountId,
            destinationAccountId: input.destinationAccountId,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            description: input.description,
            idempotencyKey: input.idempotencyKey,
            transactionDate: new Date(),
        });
    }

    /**
     * Reverses a completed transaction by creating a mirror rebuttal.
     * Idempotency key is stable per original tx so retries do not double-refund.
     */
    async reverseTransaction(txId: string, organizationId: string, reason: string) {
        const original = await this.transactionsRepo.findById(txId);
        if (!original) throw new NotFoundError("Transaction not found");
        if (original.organizationId !== organizationId) {
            throw new NotFoundError("Transaction not found");
        }
        if (original.status === "reversed") throw new ConflictError("Transaction already reversed");

        const refundKey = IdempotencyKeys.refund(txId);

        let reversalTxId: string;
        try {
            reversalTxId = await this.executeTransaction({
                organizationId,
                categoryId: FINANCIAL_CATEGORIES.REFUND,
                sourceAccountId: original.destinationAccountId,
                destinationAccountId: original.sourceAccountId,
                currencyId: original.currencyId,
                amountCents: original.amountCents,
                description: `Reversal of ${txId}: ${reason}`,
                idempotencyKey: refundKey,
                transactionDate: new Date(),
            });
        } catch (error) {
            // Mirror already landed (prior attempt); still ensure original is marked reversed.
            if (!(error instanceof ConflictError)) throw error;
            const existing = await this.transactionsRepo.findByIdempotencyKey(
                organizationId,
                refundKey
            );
            if (!existing) throw error;
            reversalTxId = existing.id;
        }

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

        // Org-centric direction: money into an org-owned account is credit; out is debit.
        const data = transactions.map((tx) => {
            const sourceType = (tx as any).sourceAccount?.ownerType as string | undefined;
            const destType = (tx as any).destinationAccount?.ownerType as string | undefined;
            let direction: "credit" | "debit" | null = null;
            if (filters.accountId) {
                direction =
                    tx.destinationAccountId === filters.accountId
                        ? "credit"
                        : tx.sourceAccountId === filters.accountId
                          ? "debit"
                          : null;
            } else if (destType === "org" && sourceType === "user") {
                direction = "credit";
            } else if (sourceType === "org" && destType === "user") {
                direction = "debit";
            }

            return { ...tx, direction };
        });

        return {
            data,
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
