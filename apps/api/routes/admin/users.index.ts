import { createRouter } from "@api/lib/app.lib";
import { AdminUsersHandler } from "./users.handlers";
import { AdminUsersRoutes } from "./users.routes";

export const adminUsersRoutes = createRouter().openapi(
    AdminUsersRoutes.list,
    AdminUsersHandler.list
);
