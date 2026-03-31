import { createRouter } from "@api/lib/app.lib";
import { WalletHandler } from "./wallet.handlers";
import { WalletRoutes } from "./wallet.routes";

export const walletRoutes = createRouter()
    .openapi(WalletRoutes.getBalance, WalletHandler.getWalletBalance)
    .openapi(WalletRoutes.getTransactions, WalletHandler.getTransactionHistory)
    .openapi(WalletRoutes.executeTransfer, WalletHandler.executeTransfer)
    .openapi(WalletRoutes.adminCredit, WalletHandler.adminCredit)
    .openapi(WalletRoutes.adminDebit, WalletHandler.adminDebit)
    .openapi(WalletRoutes.createAccount, WalletHandler.createAccount)
    .openapi(WalletRoutes.listAccounts, WalletHandler.listAccounts)
    .openapi(WalletRoutes.deactivateAccount, WalletHandler.deactivateAccount);
