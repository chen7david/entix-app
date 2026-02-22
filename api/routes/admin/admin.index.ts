import { createRouter } from "@api/lib/app.lib";
import { AdminRoutes } from "./admin.routes";
import { AdminHandlers } from "./admin.handlers";
import { requireSuperAdmin } from "@api/middleware/auth.middleware";

export const adminRoutes = createRouter();

adminRoutes.use('/admin/*', requireSuperAdmin);

adminRoutes.openapi(
    AdminRoutes.getOrganizations,
    AdminHandlers.getOrganizations
);
