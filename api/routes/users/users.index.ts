import { createRouter } from "@api/lib/app.lib";
import { UserHandler } from "./user.handlers";
import { UserRoutes } from './user.routes'

export const userRoutes = createRouter()
    .openapi(UserRoutes.create, UserHandler.create)
    .openapi(UserRoutes.findAll, UserHandler.findAll);

