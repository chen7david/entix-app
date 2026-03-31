import { createRouter } from "@api/lib/app.lib";
import { FinanceHandler } from "./finance.handlers";
import { FinanceRoutes } from "./finance.routes";

export const financeRoutes = createRouter()
    .openapi(FinanceRoutes.getBalance, FinanceHandler.getWalletBalance)
    .openapi(FinanceRoutes.getTransactions, FinanceHandler.getTransactionHistory)
    .openapi(FinanceRoutes.executeTransfer, FinanceHandler.executeTransfer)
    .openapi(FinanceRoutes.adminCredit, FinanceHandler.adminCredit)
    .openapi(FinanceRoutes.adminDebit, FinanceHandler.adminDebit)
    .openapi(FinanceRoutes.createAccount, FinanceHandler.createAccount)
    .openapi(FinanceRoutes.listAccounts, FinanceHandler.listAccounts)
    .openapi(FinanceRoutes.deactivateAccount, FinanceHandler.deactivateAccount)
    .openapi(FinanceRoutes.adminGetOrgAccounts, FinanceHandler.adminGetOrgAccounts)
    .openapi(FinanceRoutes.adminGetTreasuryBalance, FinanceHandler.adminGetTreasuryBalance)
    .openapi(FinanceRoutes.getOrgCurrencyStatus, FinanceHandler.getOrgCurrencyStatus)
    .openapi(FinanceRoutes.activateCurrency, FinanceHandler.activateCurrency);
