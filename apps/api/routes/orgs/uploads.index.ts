import { createRouter } from "@api/lib/app.lib";
import { OrgUploadsHandler } from "./uploads.handlers";
import { OrgUploadsRoutes } from "./uploads.routes";

export const uploadRoutes = createRouter()
    .openapi(OrgUploadsRoutes.requestPresignedUrl, OrgUploadsHandler.requestPresignedUrl)
    .openapi(OrgUploadsRoutes.completeUpload, OrgUploadsHandler.completeUpload)
    .openapi(OrgUploadsRoutes.listUploads, OrgUploadsHandler.listUploads)
    .openapi(OrgUploadsRoutes.deleteUpload, OrgUploadsHandler.deleteUpload);
