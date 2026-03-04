import { createRouter } from "@api/lib/app.lib";
import { AdminOrgsHandler } from "./orgs.handlers";
import { AdminOrgsRoutes } from "./orgs.routes";

export const adminOrgsRoutes = createRouter()
    .openapi(AdminOrgsRoutes.list, AdminOrgsHandler.list);
