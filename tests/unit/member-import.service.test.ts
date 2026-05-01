import type { MemberRepository } from "@api/repositories/member.repository";
import type { SocialMediaRepository } from "@api/repositories/social-media.repository";
import type { UserRepository } from "@api/repositories/user.repository";
import type { UserProfileRepository } from "@api/repositories/user-profile.repository";
import type { FinanceBillingPlansService } from "@api/services/financial/finance-billing-plans.service";
import type { FinanceWalletService } from "@api/services/financial/finance-wallet.service";
import { MemberImportService } from "@api/services/member-import.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("MemberImportService", () => {
    let userRepo: UserRepository;
    let memberRepo: MemberRepository;
    let profileRepo: UserProfileRepository;
    let socialRepo: SocialMediaRepository;
    let billingPlansService: FinanceBillingPlansService;
    let walletService: FinanceWalletService;
    let service: MemberImportService;

    beforeEach(() => {
        userRepo = {
            findByEmails: vi.fn().mockResolvedValue([]),
            findByIds: vi.fn().mockResolvedValue([]),
            prepareUpsert: vi.fn().mockReturnValue({}),
            prepareUpdate: vi.fn().mockReturnValue({}),
            prepareAccountInsertRaw: vi.fn().mockReturnValue({}),
            executeBatch: vi.fn().mockResolvedValue(undefined),
        } as unknown as UserRepository;

        memberRepo = {
            findByUserIds: vi.fn().mockResolvedValue([]),
            prepareInsertQuery: vi.fn().mockReturnValue({}),
        } as unknown as MemberRepository;

        profileRepo = {
            prepareUpsert: vi.fn().mockReturnValue({}),
            preparePhoneDelete: vi.fn().mockReturnValue({}),
            preparePhoneInsert: vi.fn().mockReturnValue({}),
            prepareAddressDelete: vi.fn().mockReturnValue({}),
            prepareAddressInsert: vi.fn().mockReturnValue({}),
            prepareSocialMediaDelete: vi.fn().mockReturnValue({}),
            prepareSocialMediaInsert: vi.fn().mockReturnValue({}),
        } as unknown as UserProfileRepository;

        socialRepo = {
            findAllTypes: vi.fn().mockResolvedValue([]),
        } as unknown as SocialMediaRepository;

        billingPlansService = {
            getActivePlanForOrg: vi.fn().mockResolvedValue({ currencyId: "fcur_cny" }),
            hasAssignedPlanInCurrency: vi.fn().mockResolvedValue(false),
            assignPlan: vi.fn().mockResolvedValue({}),
        } as unknown as FinanceBillingPlansService;

        walletService = {
            provisionWalletIfNotExists: vi.fn().mockResolvedValue({ created: 0 }),
        } as unknown as FinanceWalletService;

        service = new MemberImportService(
            userRepo,
            memberRepo,
            profileRepo,
            socialRepo,
            billingPlansService,
            walletService
        );
    });

    it("fetches default plan once per import run", async () => {
        const result = await service.importMembers(
            "org_1",
            [
                { email: "a@example.com", name: "A" },
                { email: "b@example.com", name: "B" },
            ],
            { defaultBillingPlanId: "plan_1", billingPlanConflict: "replace" }
        );

        expect(billingPlansService.getActivePlanForOrg).toHaveBeenCalledTimes(1);
        expect(billingPlansService.assignPlan).toHaveBeenCalledTimes(2);
        expect(result.created).toBe(2);
        expect(result.linked).toBe(2);
        expect(result.billingSkipped).toBe(0);
        expect(result.failed).toBe(0);
    });

    it("does not overcount created/linked when batch write fails", async () => {
        vi.mocked(userRepo.executeBatch).mockRejectedValueOnce(new Error("batch exploded"));

        const result = await service.importMembers(
            "org_1",
            [{ email: "fail@example.com", name: "Will Fail" }],
            { defaultBillingPlanId: "plan_1", billingPlanConflict: "replace" }
        );

        expect(result.created).toBe(0);
        expect(result.linked).toBe(0);
        expect(result.failed).toBe(1);
        expect(result.billingAssigned).toBe(0);
        expect(result.billingSkipped).toBe(0);
        expect(result.errors[0]).toContain("fail@example.com");
    });

    it("does not assign billing when skip conflict finds same-currency assignment", async () => {
        vi.mocked(billingPlansService.hasAssignedPlanInCurrency).mockResolvedValue(true);

        const result = await service.importMembers(
            "org_1",
            [{ email: "a@example.com", name: "A" }],
            { defaultBillingPlanId: "plan_1", billingPlanConflict: "skip" }
        );

        expect(billingPlansService.assignPlan).not.toHaveBeenCalled();
        expect(result.billingAssigned).toBe(0);
        expect(result.billingSkipped).toBe(1);
        expect(result.failed).toBe(0);
    });

    it("provisions wallet and increments billingSkipped for unlinked member on skip conflict", async () => {
        vi.mocked(userRepo.findByEmails).mockResolvedValue([
            { id: "user_existing_1", email: "a@example.com" } as any,
        ]);
        vi.mocked(memberRepo.findByUserIds).mockResolvedValue([]);
        vi.mocked(walletService.provisionWalletIfNotExists).mockResolvedValue({
            created: 1,
        } as any);
        vi.mocked(billingPlansService.hasAssignedPlanInCurrency).mockResolvedValue(true);

        const result = await service.importMembers(
            "org_1",
            [{ email: "a@example.com", name: "A" }],
            { defaultBillingPlanId: "plan_1", billingPlanConflict: "skip" }
        );

        expect(walletService.provisionWalletIfNotExists).toHaveBeenCalledTimes(1);
        expect(billingPlansService.assignPlan).not.toHaveBeenCalled();
        expect(result.walletInitialized).toBe(1);
        expect(result.billingAssigned).toBe(0);
        expect(result.billingSkipped).toBe(1);
        expect(result.failed).toBe(0);
    });
});
