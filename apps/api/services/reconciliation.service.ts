import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialTransactionCategoriesRepository } from "@api/repositories/financial/financial-transaction-categories.repository";
import type { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { BaseService } from "./base.service";
import type { SessionPaymentService } from "./financial/session-payment.service";

export type MissedPaymentRetryOutcome =
    | { outcome: "not_found" }
    | { outcome: "already_acknowledged" }
    | { outcome: "invalid_metadata" }
    | { outcome: "accounts_unresolved" }
    | { outcome: "success" }
    | { outcome: "processing_failed"; message: string };

/**
 * Internal reconciliation flows (missed payments, retries).
 */
export class ReconciliationService extends BaseService {
    constructor(
        private readonly auditRepo: SystemAuditRepository,
        private readonly accountsRepo: FinancialAccountsRepository,
        private readonly categoriesRepo: FinancialTransactionCategoriesRepository,
        private readonly sessionPaymentService: SessionPaymentService
    ) {
        super();
    }

    listMissedPayments(filters: Parameters<SystemAuditRepository["list"]>[0]) {
        return this.auditRepo.list(filters);
    }

    async retryMissedPayment(
        eventId: string,
        organizationId: string
    ): Promise<MissedPaymentRetryOutcome> {
        const event = await this.auditRepo.findByIdAndOrganization(eventId, organizationId);

        if (!event || event.eventType !== "payment.missed") {
            return { outcome: "not_found" };
        }

        if (event.acknowledgedAt) {
            return { outcome: "already_acknowledged" };
        }

        let metadata: Record<string, unknown>;
        try {
            metadata = JSON.parse(event.metadata || "{}") as Record<string, unknown>;
        } catch {
            return { outcome: "invalid_metadata" };
        }

        const userId = metadata.userId as string | undefined;
        const sessionId = metadata.sessionId as string | undefined;
        const amountCents = metadata.amountCents as number | undefined;
        const currencyId = metadata.currencyId as string | undefined;

        if (!userId || !sessionId || amountCents === undefined || !currencyId) {
            return { outcome: "invalid_metadata" };
        }

        const userWallets = await this.accountsRepo.findActiveByOwner(
            userId,
            "user",
            organizationId
        );
        const sourceAccount = userWallets.find((w) => w.currencyId === currencyId);

        const orgAccounts = await this.accountsRepo.findActiveByOwner(
            organizationId,
            "org",
            organizationId
        );
        const destAccount = orgAccounts.find((w) => w.currencyId === currencyId);

        if (!sourceAccount || !destAccount) {
            return { outcome: "accounts_unresolved" };
        }

        try {
            const categories = await this.categoriesRepo.findCategories();
            const classFeeCategory =
                categories.find((cat) => cat.name === "Class Fee") || categories[0];

            await this.sessionPaymentService.processSessionPayment({
                organizationId,
                sessionId,
                userId,
                amountCents,
                currencyId,
                sourceAccountId: sourceAccount.id,
                destinationAccountId: destAccount.id,
                categoryId: classFeeCategory.id,
                performedBy: null,
                note: `Automated retry for event ${eventId}`,
            });

            await this.auditRepo.setAcknowledged(eventId, {
                at: new Date(),
                acknowledgedBy: null,
            });

            return { outcome: "success" };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error during retry";
            return { outcome: "processing_failed", message };
        }
    }
}
