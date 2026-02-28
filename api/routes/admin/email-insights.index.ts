import { createRouter } from "@api/lib/app.lib";
import { EmailInsightsHandler } from "./email-insights.handlers";
import { EmailInsightsRoutes } from "./email-insights.routes";

export const emailInsightsRoutes = createRouter()
    .openapi(EmailInsightsRoutes.list, EmailInsightsHandler.list)
    .openapi(EmailInsightsRoutes.get, EmailInsightsHandler.get);
