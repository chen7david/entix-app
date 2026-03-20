import { AppContext } from "@api/helpers/types.helpers";
import { UserRepository } from "@api/repositories/user.repository";
import { OrganizationRepository } from "@api/repositories/organization.repository";
import { MemberRepository } from "@api/repositories/member.repository";
import { UploadRepository } from "@api/repositories/upload.repository";
import { MediaRepository } from "@api/repositories/media.repository";
import { PlaylistRepository } from "@api/repositories/playlist.repository";
import { getDbClient } from "./db.factory";
import { auth } from "@api/lib/auth/auth";

export const getUserRepository = (ctx: AppContext) => {
    return new UserRepository(getDbClient(ctx), auth(ctx));
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

export const getMediaRepository = (ctx: AppContext) => {
    return new MediaRepository(getDbClient(ctx));
};

export const getPlaylistRepository = (ctx: AppContext) => {
    return new PlaylistRepository(getDbClient(ctx));
};
