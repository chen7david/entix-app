import type { AppDb } from "@api/factories/db.factory";
import {
    type NewPaymentRequest,
    type PaymentRequest,
    type PaymentRequestStatus,
    paymentRequests,
} from "@shared/db/schema";
import { and, desc, eq } from "drizzle-orm";

/**
 * Repository for payment_requests database operations.
 * Supports insert, status transitions, and idempotency-key lookups.
 */
export class PaymentRequestsRepository {
    constructor(private readonly db: AppDb) {}

    /**
     * Inserts a new payment request and returns the created record.
     */
    async insert(input: NewPaymentRequest): Promise<PaymentRequest> {
        const [record] = await this.db.insert(paymentRequests).values(input).returning();
        return record;
    }

    /**
     * Looks up an existing payment request by idempotency key.
     * Use before processing to detect duplicate submissions.
     */
    async findByIdempotencyKey(idempotencyKey: string): Promise<PaymentRequest | null> {
        return (
            (await this.db.query.paymentRequests.findFirst({
                where: eq(paymentRequests.idempotencyKey, idempotencyKey),
            })) ?? null
        );
    }

    /**
     * Finds a payment request by its primary key.
     */
    async findById(id: string): Promise<PaymentRequest | null> {
        return (
            (await this.db.query.paymentRequests.findFirst({
                where: eq(paymentRequests.id, id),
            })) ?? null
        );
    }

    /**
     * Updates the status (and optional fields) of a payment request.
     */
    async updateStatus(
        id: string,
        status: PaymentRequestStatus,
        fields?: {
            transactionId?: string;
            failureReason?: string;
            processedAt?: Date;
            lastAttemptedAt?: Date;
            attemptCount?: number;
        }
    ): Promise<PaymentRequest> {
        const now = new Date();
        const [updated] = await this.db
            .update(paymentRequests)
            .set({
                status,
                updatedAt: now,
                ...(fields?.transactionId !== undefined && { transactionId: fields.transactionId }),
                ...(fields?.failureReason !== undefined && { failureReason: fields.failureReason }),
                ...(fields?.processedAt !== undefined && { processedAt: fields.processedAt }),
                ...(fields?.lastAttemptedAt !== undefined && {
                    lastAttemptedAt: fields.lastAttemptedAt,
                }),
                ...(fields?.attemptCount !== undefined && { attemptCount: fields.attemptCount }),
            })
            .where(eq(paymentRequests.id, id))
            .returning();
        return updated;
    }

    /**
     * Lists all payment requests for a given reference (e.g. a session).
     */
    async listByReference(
        referenceType: string,
        referenceId: string
    ): Promise<PaymentRequest[]> {
        return this.db
            .select()
            .from(paymentRequests)
            .where(
                and(
                    eq(paymentRequests.referenceType, referenceType),
                    eq(paymentRequests.referenceId, referenceId)
                )
            )
            .orderBy(desc(paymentRequests.createdAt));
    }

    /**
     * Lists payment requests for a specific organization, optionally filtered by status.
     */
    async listByOrganization(
        organizationId: string,
        status?: PaymentRequestStatus
    ): Promise<PaymentRequest[]> {
        const conditions = [eq(paymentRequests.organizationId, organizationId)];
        if (status) conditions.push(eq(paymentRequests.status, status));
        return this.db
            .select()
            .from(paymentRequests)
            .where(and(...conditions))
            .orderBy(desc(paymentRequests.createdAt));
    }
}
