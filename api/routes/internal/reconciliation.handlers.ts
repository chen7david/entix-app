import { getDbClient } from "@api/factories/db.factory";
import {
    getFinancialAccountsRepository,
    getSystemAuditRepository,
} from "@api/factories/repository.factory";
import { getSessionPaymentService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import { systemAuditEvents } from "@shared/db/schema";
import { and, eq } from "drizzle-orm";
import type { ReconciliationRoutes } from "./reconciliation.routes";

export const ReconciliationHandler = {
    listMissedPayments: (async (c) => {
        const auditRepo = getSystemAuditRepository(c);
        const query = c.req.valid("query") as any; // Cast as any to bypass transient inference issue
        const {
            organizationId,
            severity,
            eventType,
            actorId,
            unresolvedOnly,
            limit,
            cursor,
            direction,
        } = query;

        const result = await auditRepo.list({
            organizationId,
            severity,
            eventType: eventType || "payment.missed",
            actorId,
            unresolvedOnly: unresolvedOnly ?? true,
            limit,
            cursor,
            direction,
        });

        return c.json(result, HttpStatusCodes.OK);
    }) as AppHandler<typeof ReconciliationRoutes.listMissedPayments>,

    retryMissedPayment: (async (c) => {
        const { eventId, organizationId } = c.req.valid("json");
        const accountsRepo = getFinancialAccountsRepository(c);
        const paymentService = getSessionPaymentService(c);
        const db = getDbClient(c);

        const event = await db.query.systemAuditEvents.findFirst({
            where: and(
                eq(systemAuditEvents.id, eventId),
                eq(systemAuditEvents.organizationId, organizationId)
            ),
        });

        if (!event || event.eventType !== "payment.missed") {
            return c.json(
                {
                    success: false,
                    status: "failed",
                    message: "Event not found or not a missed payment",
                },
                HttpStatusCodes.NOT_FOUND
            );
        }

        if (event.acknowledgedAt) {
            return c.json(
                {
                    success: true,
                    status: "acknowledged",
                    message: "Payment already processed or acknowledged",
                },
                HttpStatusCodes.OK
            );
        }

        const metadata = JSON.parse(event.metadata || "{}");
        const { userId, sessionId, amountCents, currencyId } = metadata;

        if (!userId || !sessionId || !amountCents || !currencyId) {
            return c.json(
                {
                    success: false,
                    status: "failed",
                    message: "Invalid event metadata",
                },
                HttpStatusCodes.UNPROCESSABLE_ENTITY
            );
        }

        const userWallets = await accountsRepo.findActiveByOwner(userId, "user", organizationId);
        const sourceAccount = userWallets.find((w) => w.currencyId === currencyId);

        const orgAccounts = await accountsRepo.findActiveByOwner(
            organizationId,
            "org",
            organizationId
        );
        const destAccount = orgAccounts.find((w) => w.currencyId === currencyId);

        if (!sourceAccount || !destAccount) {
            return c.json(
                {
                    success: false,
                    status: "failed",
                    message: "Could not resolve source or destination accounts",
                },
                HttpStatusCodes.UNPROCESSABLE_ENTITY
            );
        }

        try {
            const categories = await db.query.financialTransactionCategories.findMany();
            const classFeeCategory =
                categories.find((cat) => cat.name === "Class Fee") || categories[0];

            await paymentService.processSessionPayment({
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

            await db
                .update(systemAuditEvents)
                .set({
                    acknowledgedAt: new Date(),
                    acknowledgedBy: null,
                })
                .where(eq(systemAuditEvents.id, eventId));

            return c.json(
                {
                    success: true,
                    status: "retried",
                    message: "Payment successfully processed",
                },
                HttpStatusCodes.OK
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error during retry";
            return c.json(
                {
                    success: false,
                    status: "failed",
                    message,
                },
                HttpStatusCodes.OK
            );
        }
    }) as AppHandler<typeof ReconciliationRoutes.retryMissedPayment>,
};
