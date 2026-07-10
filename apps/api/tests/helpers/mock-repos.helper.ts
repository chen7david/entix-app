import type { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import type { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import type { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { vi } from "vitest";

/**
 * Partial mock builders to satisfy service dependencies in unit tests.
 * Zero use of 'any' — using unknown casting as the strictly allowed bridge
 * for partial interface satisfaction in mocks.
 */

export const buildMockTransactionsRepo = () => {
    return {
        insert: vi.fn(),
        findById: vi.fn(),
        listByOrganization: vi.fn(),
    } as unknown as FinancialTransactionsRepository;
};

export const buildMockAccountsRepo = (defaults?: {
    balanceCents?: number;
    overdraftLimitCents?: number;
}) => {
    return {
        findById: vi.fn().mockResolvedValue({
            id: "acc_test",
            balanceCents: defaults?.balanceCents ?? 1000,
            overdraftLimitCents: defaults?.overdraftLimitCents ?? 0,
            isActive: true,
        }),
        updateBalance: vi.fn(),
    } as unknown as FinancialAccountsRepository;
};

export const buildMockAttendancesRepo = () => {
    return {
        prepareUpdatePaymentStatus: vi.fn().mockReturnValue({}),
    } as unknown as SessionAttendancesRepository;
};

export const buildMockAuditRepo = () => {
    return {
        prepareInsert: vi.fn().mockReturnValue({}),
    } as unknown as SystemAuditRepository;
};

export const buildMockBillingPlansRepo = () => {
    return {
        getMemberPlanByCurrency: vi.fn().mockResolvedValue(null),
    } as unknown as FinanceBillingPlansRepository;
};
