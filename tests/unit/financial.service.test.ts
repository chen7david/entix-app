import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { AdminFinancialService } from "@api/services/financial/admin-financial.service";
import { OrgFinancialService } from "@api/services/financial/org-financial.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Financial Services - NotFoundError Coverage", () => {
    let accountsRepo: FinancialAccountsRepository;
    let transactionsRepo: FinancialTransactionsRepository;
    let currenciesRepo: FinancialCurrenciesRepository;

    let adminService: AdminFinancialService;
    let orgService: OrgFinancialService;

    beforeEach(() => {
        // Mock Repositories
        accountsRepo = {
            findById: vi.fn(),
            findActiveByOwner: vi.fn(),
            insert: vi.fn(),
            updateName: vi.fn(),
            archive: vi.fn(),
            deactivate: vi.fn(),
        } as any;

        transactionsRepo = {
            findById: vi.fn(),
            insert: vi.fn(),
            reverse: vi.fn(),
        } as any;

        currenciesRepo = {
            findById: vi.fn(),
            findAllActive: vi.fn(),
            findAllWithOrgStatus: vi.fn(),
        } as any;

        const db = {} as any;

        adminService = new AdminFinancialService(db, accountsRepo, transactionsRepo);
        orgService = new OrgFinancialService(db, accountsRepo, transactionsRepo, currenciesRepo);
    });

    describe("OrgFinancialService", () => {
        it("reverseTransaction: should throw if transaction not found", async () => {
            vi.mocked(transactionsRepo.findById).mockResolvedValue(null);
            await expect(
                orgService.reverseTransaction("tx_123", "org_123", "Reason")
            ).rejects.toThrow("Transaction not found");
        });

        it("activateCurrency: should throw if currency not found", async () => {
            vi.mocked(currenciesRepo.findAllWithOrgStatus).mockResolvedValue([]);
            await expect(orgService.activateCurrency("org_123", "fcur_usd")).rejects.toThrow(
                "Currency not found"
            );
        });
    });

    describe("AdminFinancialService", () => {
        it("archiveAccount: should throw error if account not found", async () => {
            vi.mocked(accountsRepo.findById).mockResolvedValue(null);
            await expect(adminService.archiveAccount("facc_123")).rejects.toThrow(
                "Account not found"
            );
        });
    });
});
