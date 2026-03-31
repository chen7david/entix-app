import { createRouter } from "@api/lib/app.lib";
import { FinanceHandler } from "./finance.handlers";
import { FinanceRoutes } from "./finance.routes";

export const financeRoutes = createRouter()
    .openapi(FinanceRoutes.getBalance, FinanceHandler.getWalletBalance)
    .openapi(FinanceRoutes.getTransactions, FinanceHandler.getTransactionHistory)
    .openapi(FinanceRoutes.executeTransfer, FinanceHandler.executeTransfer)
    .openapi(FinanceRoutes.createAccount, FinanceHandler.createAccount)
    .openapi(FinanceRoutes.listAccounts, FinanceHandler.listAccounts)
    .openapi(FinanceRoutes.deactivateAccount, FinanceHandler.deactivateAccount)
    .openapi(FinanceRoutes.getOrgCurrencyStatus, FinanceHandler.getOrgCurrencyStatus)
    .openapi(FinanceRoutes.activateCurrency, FinanceHandler.activateCurrency)
    .openapi(FinanceRoutes.initializeUserWallet, FinanceHandler.initializeUserWallet);
