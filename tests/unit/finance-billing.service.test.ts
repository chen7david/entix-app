import { ConflictError, NotFoundError } from "@api/errors/app.error";
import { FinanceBillingPlansService } from "@api/services/financial/finance-billing-plans.service";
import { FINANCIAL_CURRENCIES } from "@shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("FinanceBillingPlansService Unit Test", () => {
    let repo: any;
    let service: FinanceBillingPlansService;

    beforeEach(() => {
        repo = {
            findById: vi.fn(),
            getMemberPlanByCurrency: vi.fn(),
            createPlan: vi.fn(),
            createMemberPlan: vi.fn(),
            replaceMemberPlan: vi.fn(),
            listOrgPlans: vi.fn(),
            listMemberPlans: vi.fn(),
            findMemberPlanById: vi.fn(),
            deleteMemberPlan: vi.fn(),
        };
        service = new FinanceBillingPlansService(repo);
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
                    rates: [
                        { participantCount: 1, rateCentsPerMinute: 100 },
                        { participantCount: 5, rateCentsPerMinute: 80 },
                    ],
                },
            });

            const rate = await service.resolveBillingPlanRate(userId, orgId, currencyId, 5);
            expect(rate).toBe(80);
        });

        it("should throw NotFoundError if participant count is not configured", async () => {
            repo.getMemberPlanByCurrency.mockResolvedValue({
                plan: {
                    id: "p1",
                    name: "Tiered Plan",
                    isActive: true,
                    rates: [{ participantCount: 1, rateCentsPerMinute: 100 }],
                },
            });

            await expect(
                service.resolveBillingPlanRate(userId, orgId, currencyId, 5)
            ).rejects.toThrow(NotFoundError);

            await expect(
                service.resolveBillingPlanRate(userId, orgId, currencyId, 5)
            ).rejects.toThrow("is not configured for session size: 5");
        });

        it("should throw NotFoundError if no active plan is assigned", async () => {
            repo.getMemberPlanByCurrency.mockResolvedValue(null);

            await expect(
                service.resolveBillingPlanRate(userId, orgId, currencyId, 1)
            ).rejects.toThrow(NotFoundError);

            await expect(
                service.resolveBillingPlanRate(userId, orgId, currencyId, 1)
            ).rejects.toThrow("No active billing plan assigned for student");
        });

        it("should throw NotFoundError if plan is inactive", async () => {
            repo.getMemberPlanByCurrency.mockResolvedValue({
                plan: {
                    id: "p1",
                    name: "Inactive Plan",
                    isActive: false,
                    rates: [{ participantCount: 1, rateCentsPerMinute: 100 }],
                },
            });

            await expect(
                service.resolveBillingPlanRate(userId, orgId, currencyId, 1)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe("assignPlan", () => {
        it("should throw ConflictError if plan for currency already exists", async () => {
            repo.findById.mockResolvedValue({
                id: "p2",
                organizationId: "o1",
                currencyId: "fcur_etd",
            });
            repo.getMemberPlanByCurrency.mockResolvedValue({ id: "existing_assignment" });

            await expect(service.assignPlan("o1", { userId: "u1", planId: "p2" })).rejects.toThrow(
                ConflictError
            );
        });
    });
});
