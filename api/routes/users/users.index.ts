import { createRouter } from "@api/lib/app.lib";
import { UserHandler } from "./user.handlers";
import { UserRoutes } from './user.routes';
import { UserProfileHandler } from "./user-profiles.handlers";
import { UserProfileRoutes } from "./user-profiles.routes";
import { UserAvatarHandlers } from "./user-avatar.handlers";
import { UserAvatarRoutes } from "./user-avatar.routes";
import { UserAssetHandlers, UserAssetRoutes } from "./user-assets.routes";

export const userRoutes = createRouter()
    .openapi(UserRoutes.findAll, UserHandler.findAll)
    .openapi(UserAssetRoutes.completeUpload, UserAssetHandlers.completeUpload)
    .openapi(UserAvatarRoutes.requestAvatarUploadUrl, UserAvatarHandlers.requestAvatarUploadUrl)
    .openapi(UserAvatarRoutes.updateAvatar, UserAvatarHandlers.updateAvatar)
    .openapi(UserAvatarRoutes.removeAvatar, UserAvatarHandlers.removeAvatar)
    .openapi(UserProfileRoutes.getAggregate, UserProfileHandler.getAggregate)
    .openapi(UserProfileRoutes.upsertProfile, UserProfileHandler.upsertProfile)
    .openapi(UserProfileRoutes.addPhone, UserProfileHandler.addPhone)
    .openapi(UserProfileRoutes.updatePhone, UserProfileHandler.updatePhone)
    .openapi(UserProfileRoutes.deletePhone, UserProfileHandler.deletePhone)
    .openapi(UserProfileRoutes.addAddress, UserProfileHandler.addAddress)
    .openapi(UserProfileRoutes.updateAddress, UserProfileHandler.updateAddress)
    .openapi(UserProfileRoutes.deleteAddress, UserProfileHandler.deleteAddress)
    .openapi(UserProfileRoutes.addSocial, UserProfileHandler.addSocial)
    .openapi(UserProfileRoutes.updateSocial, UserProfileHandler.updateSocial)
    .openapi(UserProfileRoutes.deleteSocial, UserProfileHandler.deleteSocial);
