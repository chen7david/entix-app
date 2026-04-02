import { createRouter } from "@api/lib/app.lib";
import { AdminFinanceHandler } from "./finance.handlers";
import { AdminFinanceRoutes } from "./finance.routes";

const router = createRouter();

export const adminFinanceRoutes = router
    .openapi(AdminFinanceRoutes.getTreasuryBalance, AdminFinanceHandler.getTreasuryBalance)
    .openapi(AdminFinanceRoutes.getOrgAccounts, AdminFinanceHandler.getOrgAccounts)
    .openapi(AdminFinanceRoutes.adminCredit, AdminFinanceHandler.adminCredit)
    .openapi(AdminFinanceRoutes.adminDebit, AdminFinanceHandler.adminDebit)
    .openapi(AdminFinanceRoutes.updateAccount, AdminFinanceHandler.updateAccount)
    .openapi(AdminFinanceRoutes.archiveAccount, AdminFinanceHandler.archiveAccount);
