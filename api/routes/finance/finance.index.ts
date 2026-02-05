import { createRouter } from "@api/lib/app.lib";
import { FinanceRoutes } from "./finance.routes";
import { FinanceHandler } from "./finance.handlers";

export const financeRoutes = createRouter()
    .openapi(FinanceRoutes.transfer, FinanceHandler.transfer)
    .openapi(FinanceRoutes.getBalance, FinanceHandler.getBalance)
    .openapi(FinanceRoutes.getTransactions, FinanceHandler.getTransactions)
    .openapi(FinanceRoutes.reverse, FinanceHandler.reverse)
    .openapi(FinanceRoutes.setPin, FinanceHandler.setPin);
