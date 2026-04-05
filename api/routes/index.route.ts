import { emailInsightsRoutes } from "./admin/email-insights.index";
import { adminFinanceRoutes } from "./admin/finance.index";
import { adminOrgsRoutes } from "./admin/orgs.index";
import { adminUsersRoutes } from "./admin/users.index";
import { authRoutes } from "./auth/auth.index";
import { financeRoutes } from "./orgs/finance.index";
import { mediaRoutes } from "./orgs/media.index";
import { memberWalletRoutes } from "./orgs/member-wallet.index";
import { memberRoutes } from "./orgs/members.index";
import { playlistRoutes } from "./orgs/playlist.index";
import { scheduleRoutes } from "./orgs/schedule.index";
import { uploadRoutes } from "./orgs/uploads.index";
import { socialMediaRoutes } from "./social-media/social-media.index";
import { userRoutes } from "./users/users.index";

export const routes = [
    userRoutes,
    authRoutes,
    memberRoutes,
    emailInsightsRoutes,
    adminOrgsRoutes,
    adminUsersRoutes,
    adminFinanceRoutes,
    uploadRoutes,
    mediaRoutes,
    playlistRoutes,
    scheduleRoutes,
    financeRoutes,
    memberWalletRoutes,
    socialMediaRoutes,
];
