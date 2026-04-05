import { createRouter } from "@api/lib/app.lib";
import { AuthHandler } from "./auth.handlers";
import { AuthRoutes } from "./auth.routes";

export const authRoutes = createRouter();

authRoutes.openapi(AuthRoutes.signupWithOrg, AuthHandler.signupWithOrg);
authRoutes.openapi(AuthRoutes.resendVerificationAdmin, AuthHandler.resendVerificationAdmin);
