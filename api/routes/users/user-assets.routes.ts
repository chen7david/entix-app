import { createRoute, z } from "@hono/zod-openapi";
import { HttpStatusCodes, HttpMethods } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { AppHandler } from "@api/helpers/types.helpers";
import { getUploadService } from "@api/factories/upload.factory";

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
            requirePermission('avatar', ['update'], 'userId') // Reuse avatar update permission for now as it's the primary global resource
        ] as const,
        request: {
            params: z.object({
                userId: z.string(),
                uploadId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            id: z.string(),
                            url: z.string(),
                            status: z.string(),
                        }),
                    },
                },
                description: "Upload completed successfully",
            },
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
    }
}
