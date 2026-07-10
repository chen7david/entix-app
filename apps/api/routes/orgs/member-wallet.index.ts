import { createRouter } from "@api/lib/app.lib";
import * as handlers from "./member-wallet.handlers";
import { MemberWalletRoutes } from "./member-wallet.routes";

export const memberWalletRoutes = createRouter()
    .openapi(MemberWalletRoutes.getSummary, handlers.getSummary)
    .openapi(MemberWalletRoutes.getTransactions, handlers.getTransactions)
    .openapi(MemberWalletRoutes.initializeWallet, handlers.initializeWallet);
