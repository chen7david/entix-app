import { AppContext } from "@api/helpers/types.helpers";
import { UserService } from "@api/services/user.service";
import { AvatarService } from "@api/services/avatar.service";
import { RegistrationService } from "@api/services/registration.service";
import { OrganizationService } from "@api/services/organization.service";
import { MailService } from "@api/services/mailer.service";
import { MediaService } from "@api/services/media.service";
import { PlaylistService } from "@api/services/playlist.service";
import { SessionScheduleService } from "@api/services/session-schedule.service";
import { UserProfileService } from "@api/services/user-profile.service";
import { SocialMediaService } from "@api/services/social-media.service";
import { BulkMemberService } from "@api/services/bulk-member.service";
import { getDbClient } from "./db.factory";
import {
    getUserRepository,
    getOrganizationRepository,
    getMemberRepository,
    getMediaRepository,
    getPlaylistRepository,
    getSessionScheduleRepository,
    getUserProfileRepository,
    getSocialMediaRepository,
} from "./repository.factory";
import { getUploadService } from "./upload.factory";

export const getUserService = (ctx: AppContext) => {
    return new UserService(getUserRepository(ctx));
};

export const getUserProfileService = (ctx: AppContext) => {
    return new UserProfileService(getUserProfileRepository(ctx));
};

export const getSocialMediaService = (ctx: AppContext) => {
    return new SocialMediaService(getSocialMediaRepository(ctx));
};

export const getAvatarService = (ctx: AppContext) => {
    return new AvatarService(
        getUserRepository(ctx),
        getUploadService(ctx)
    );
};

export const getRegistrationService = (ctx: AppContext) => {
    return new RegistrationService(
        getUserRepository(ctx),
        getOrganizationRepository(ctx),
        getMemberRepository(ctx)
    );
};

export const getOrganizationService = (ctx: AppContext) => {
    return new OrganizationService(getOrganizationRepository(ctx));
};

export const getMailService = (ctx: AppContext) => {
    return new MailService(ctx.env.RESEND_API_KEY);
};

export const getMediaService = (ctx: AppContext) => {
    return new MediaService(getMediaRepository(ctx), getUploadService(ctx));
};

export const getPlaylistService = (ctx: AppContext) => {
    return new PlaylistService(getPlaylistRepository(ctx), getUploadService(ctx));
};

export const getSessionScheduleService = (ctx: AppContext) => {
    return new SessionScheduleService(getSessionScheduleRepository(ctx));
};

export const getBulkMemberService = (ctx: AppContext) => {
    return new BulkMemberService(getDbClient(ctx));
};
