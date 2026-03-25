import { userRoutes } from "./users/users.index";
import { authRoutes } from "./auth/auth.index";
import { memberRoutes } from "./orgs/members.index";
import { emailInsightsRoutes } from "./admin/email-insights.index";
import { adminOrgsRoutes } from "./admin/orgs.index";
import { uploadRoutes } from "./orgs/uploads.index";
import { avatarRoutes } from "./orgs/avatar.index";
import { mediaRoutes } from "./orgs/media.index";
import { playlistRoutes } from "./orgs/playlist.index";
import { scheduleRoutes } from "./orgs/schedule.index";
import { socialMediaRoutes } from "./social-media/social-media.index";

export const routes = [
    userRoutes,
    authRoutes,
    memberRoutes,
    emailInsightsRoutes,
    adminOrgsRoutes,
    uploadRoutes,
    avatarRoutes,
    mediaRoutes,
    playlistRoutes,
    scheduleRoutes,
    socialMediaRoutes,
]