import { userRoutes } from "./users/users.index";
import { authRoutes } from "./auth/auth.index";
import { memberRoutes } from "./orgs/members.index";
import { adminRoutes } from "./admin/admin.index";
import { invitationRoutes } from "./orgs/invitations.index";

export const routes = [
    userRoutes,
    authRoutes,
    memberRoutes,
    adminRoutes,
    invitationRoutes,
]