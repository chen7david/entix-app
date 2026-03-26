import { AppContext } from "@api/helpers/types.helpers";
import { UserRepository } from "@api/repositories/user.repository";
import { OrganizationRepository } from "@api/repositories/organization.repository";
import { MemberRepository } from "@api/repositories/member.repository";
import { MediaRepository } from "@api/repositories/media.repository";
import { PlaylistRepository } from "@api/repositories/playlist.repository";
import { SessionScheduleRepository } from "@api/repositories/session-schedule.repository";
import { getDbClient } from "./db.factory";
import { auth } from "@api/lib/auth/auth";
import { UploadRepository, UserUploadRepository } from "@api/repositories/upload.repository";
import { UserProfileRepository } from "@api/repositories/user-profile.repository";
import { SocialMediaRepository } from "@api/repositories/social-media.repository";

export const getUserRepository = (ctx: AppContext) => {
    return new UserRepository(getDbClient(ctx), auth(ctx));
};

export const getUserProfileRepository = (ctx: AppContext) => {
    return new UserProfileRepository(getDbClient(ctx));
};

export const getSocialMediaRepository = (ctx: AppContext) => {
    return new SocialMediaRepository(getDbClient(ctx));
};

export const getOrganizationRepository = (ctx: AppContext) => {
    return new OrganizationRepository(getDbClient(ctx));
};

export const getMemberRepository = (ctx: AppContext) => {
    return new MemberRepository(getDbClient(ctx));
};


export const getUploadRepository = (ctx: AppContext) => {
    return new UploadRepository(getDbClient(ctx));
};

export const getUserUploadRepository = (ctx: AppContext) => {
    return new UserUploadRepository(getDbClient(ctx));
};

export const getMediaRepository = (ctx: AppContext) => {
    return new MediaRepository(getDbClient(ctx));
};

export const getPlaylistRepository = (ctx: AppContext) => {
    return new PlaylistRepository(getDbClient(ctx));
};

export const getSessionScheduleRepository = (ctx: AppContext) => {
    return new SessionScheduleRepository(getDbClient(ctx));
};
