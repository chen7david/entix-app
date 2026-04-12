import { NotFoundError } from "@api/errors/app.error";
import type { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import { FinanceBillingPlansService } from "@api/services/financial/finance-billing-plans.service";
import { FINANCIAL_CURRENCIES } from "@shared";
import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";

describe("FinanceBillingPlansService Unit Test", () => {
    let repo: Mocked<FinanceBillingPlansRepository>;
    let service: FinanceBillingPlansService;

    beforeEach(() => {
        repo = {
            findById: vi.fn(),
            getMemberPlanByCurrency: vi.fn(),
            createPlan: vi.fn(),
            upsertMemberPlan: vi.fn(),
            listOrgPlans: vi.fn(),
            listMemberPlans: vi.fn(),
            findMemberPlanById: vi.fn(),
            deleteMemberPlan: vi.fn(),
        } as unknown as Mocked<FinanceBillingPlansRepository>;
        service = new FinanceBillingPlansService(repo);
    });

    const createMockRate = ({
        participantCount,
        rateCentsPerMinute,
    }: {
        participantCount: number;
        rateCentsPerMinute: number;
    }) => ({
        id: "r1",
        billingPlanId: "p1",
        participantCount,
        rateCentsPerMinute,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    describe("resolveBillingPlanRate", () => {
        const userId = "u1";
        const orgId = "o1";
        const currencyId = FINANCIAL_CURRENCIES.CNY;

        it("should return the correct rate for an exact participant count match", async () => {
            repo.getMemberPlanByCurrency.mockResolvedValue({
                plan: {
                    id: "p1",
                    name: "Tiered Plan",
                    isActive: true,
                    description: null,
                    organizationId: orgId,
                    currencyId,
                    overdraftLimitCents: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    rates: [
                        createMockRate({ participantCount: 5, rateCentsPerMinute: 80 }),
                        createMockRate({ participantCount: 1, rateCentsPerMinute: 100 }),
                    ],
                },
                id: "assign_1",
                userId,
                organizationId: orgId,
                billingPlanId: "p1",
                currencyId,
                assignedAt: new Date(),
                assignedBy: null,
            });

            const rate = await service.resolveBillingPlanRate(userId, orgId, currencyId, 5);
            expect(rate).toBe(80);
        });

        it("should resolve Closest Lower Tier even if repository returns unsorted rates", async () => {
            repo.getMemberPlanByCurrency.mockResolvedValue({
                plan: {
                    id: "p1",
                    name: "Ascending Rates Cloud",
                    isActive: true,
                    description: null,
                    organizationId: orgId,
                    currencyId,
                    overdraftLimitCents: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    rates: [
                        createMockRate({ participantCount: 1, rateCentsPerMinute: 100 }),
                        createMockRate({ participantCount: 5, rateCentsPerMinute: 80 }),
                        createMockRate({ participantCount: 10, rateCentsPerMinute: 60 }),
                    ],
                },
                id: "assign_1",
                userId,
                organizationId: orgId,
                billingPlanId: "p1",
                currencyId,
                assignedAt: new Date(),
                assignedBy: null,
            });

            const rate = await service.resolveBillingPlanRate(userId, orgId, currencyId, 7);
            expect(rate).toBe(80);
        });

        it("should resolve to the lowest tier configured when headcount meets it", async () => {
            repo.getMemberPlanByCurrency.mockResolvedValue({
                plan: {
                    id: "p1",
                    name: "Single Tier",
                    isActive: true,
                    description: null,
                    organizationId: orgId,
                    currencyId,
                    overdraftLimitCents: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    rates: [createMockRate({ participantCount: 5, rateCentsPerMinute: 100 })],
                },
                id: "assign_1",
                userId,
                organizationId: orgId,
                billingPlanId: "p1",
                currencyId,
                assignedAt: new Date(),
                assignedBy: null,
            });

            const rate = await service.resolveBillingPlanRate(userId, orgId, currencyId, 5);
            expect(rate).toBe(100);
        });

        it("should throw NotFoundError if headcount is below the lowest tier", async () => {
            repo.getMemberPlanByCurrency.mockResolvedValue({
                plan: {
                    id: "p1",
                    name: "High Tier Only",
                    isActive: true,
                    description: null,
                    organizationId: orgId,
                    currencyId,
                    overdraftLimitCents: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    rates: [createMockRate({ participantCount: 5, rateCentsPerMinute: 80 })],
                },
                id: "assign_1",
                userId,
                organizationId: orgId,
                billingPlanId: "p1",
                currencyId,
                assignedAt: new Date(),
                assignedBy: null,
            });

            await expect(
                service.resolveBillingPlanRate(userId, orgId, currencyId, 2)
            ).rejects.toThrow(NotFoundError);
        });

        it("should throw NotFoundError if no active plan is assigned", async () => {
            repo.getMemberPlanByCurrency.mockResolvedValue(null);

            await expect(
                service.resolveBillingPlanRate(userId, orgId, currencyId, 1)
            ).rejects.toThrow(NotFoundError);
        });

        it("should throw NotFoundError if plan is inactive", async () => {
            repo.getMemberPlanByCurrency.mockResolvedValue({
                plan: {
                    id: "p1",
                    name: "Inactive",
                    isActive: false,
                    description: null,
                    organizationId: orgId,
                    currencyId,
                    overdraftLimitCents: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    rates: [createMockRate({ participantCount: 1, rateCentsPerMinute: 100 })],
                },
                id: "assign_1",
                userId,
                organizationId: orgId,
                billingPlanId: "p1",
                currencyId,
                assignedAt: new Date(),
                assignedBy: null,
            });

            await expect(
                service.resolveBillingPlanRate(userId, orgId, currencyId, 1)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe("assignPlan", () => {
        it("should atomically upsert the member plan assignment", async () => {
            repo.findById.mockResolvedValue({
                id: "p2",
                name: "Test Plan",
                organizationId: "o1",
                currencyId: FINANCIAL_CURRENCIES.CNY,
                description: null,
                isActive: true,
                overdraftLimitCents: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                rates: [],
            });

            await service.assignPlan("o1", { userId: "u1", planId: "p2" }, "admin_1");

            expect(repo.upsertMemberPlan).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: "u1",
                    organizationId: "o1",
                    billingPlanId: "p2",
                    currencyId: FINANCIAL_CURRENCIES.CNY,
                    assignedBy: "admin_1",
                })
            );
        });
    });
});
