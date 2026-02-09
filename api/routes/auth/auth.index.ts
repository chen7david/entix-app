import { createRouter } from "@api/lib/app.lib";
import { AuthRoutes } from "./auth.routes";
import { AuthHandler } from "./auth.handlers";

export const authRoutes = createRouter()
    .openapi(AuthRoutes.signupWithOrg, AuthHandler.signupWithOrg);
