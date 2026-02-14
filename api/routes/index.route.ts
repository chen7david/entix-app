import { userRoutes } from "./users/users.index";
import { authRoutes } from "./auth/auth.index";
import { memberRoutes } from "./organizations/members.index";

export const routes = [
    userRoutes,
    authRoutes,
    memberRoutes,
]