import { getUploadService } from "@api/factories/upload.factory";
import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import { UploadCompleteResponseSchema } from "@shared/schemas/dto/upload.dto";

/**
 * Global User Asset Routes
 */
export class UserAssetRoutes {
    static tags = ["User Assets"];

    static completeUpload = createRoute({
        tags: UserAssetRoutes.tags,
        method: HttpMethods.POST,
        path: "/users/{userId}/assets/{uploadId}/complete",
        middleware: [
            requirePermission("avatar", ["update"], "userId"), // Reuse avatar update permission for now as it's the primary global resource
        ] as const,
        request: {
            params: z.object({
                userId: z.string(),
                uploadId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                UploadCompleteResponseSchema,
                "Upload completed successfully"
            ),
        },
    });
}

/**
 * Global User Asset Handlers
 */
export class UserAssetHandlers {
    static completeUpload: AppHandler<typeof UserAssetRoutes.completeUpload> = async (ctx) => {
        const { userId, uploadId } = ctx.req.valid("param");
        const uploadService = getUploadService(ctx);
        const result = await uploadService.completeUserUpload(uploadId, userId);
        return ctx.json(result, HttpStatusCodes.OK);
    };
}
