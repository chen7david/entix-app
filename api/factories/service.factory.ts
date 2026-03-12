import { AppContext } from "@api/helpers/types.helpers";
import { UserService } from "@api/services/user.service";
import { AvatarService } from "@api/services/avatar.service";
import { RegistrationService } from "@api/services/registration.service";
import { OrganizationService } from "@api/services/organization.service";
import { MailService } from "@api/services/mailer.service";
import {
    getUserRepository,
    getOrganizationRepository,
    getMemberRepository,
} from "./repository.factory";
import { getUploadService } from "./upload.factory";

export const getUserService = (ctx: AppContext) => {
    return new UserService(getUserRepository(ctx));
};

export const getAvatarService = (ctx: AppContext) => {
    return new AvatarService(
        getUserRepository(ctx),
        getMemberRepository(ctx),
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
