import { createRoute } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent, HttpMethods } from "@api/helpers/http.helpers";
import { z } from "zod";

export const socialMediaTypeSchema = z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date().optional()
});

export class SocialMediaRoutes {
    static tags = ['Social Media'];

    static findAll = createRoute({
        tags: SocialMediaRoutes.tags,
        method: HttpMethods.GET,
        path: '/social-media-types',
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.array(socialMediaTypeSchema), 'List of global social media types explicitly seamlessly efficiently.'),
        },
    });
}
