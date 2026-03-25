import { createRoute } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent, HttpMethods } from "@api/helpers/http.helpers";
import { z } from "zod";
import { socialMediaTypeSchema } from "@shared/schemas/dto/social-media.dto";

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
