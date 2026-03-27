import { createRouter } from "@api/lib/app.lib";
import { AuthHandler } from "./auth.handlers";
import { AuthRoutes } from "./auth.routes";

export const authRoutes = createRouter().openapi(
    AuthRoutes.signupWithOrg,
    AuthHandler.signupWithOrg
);
