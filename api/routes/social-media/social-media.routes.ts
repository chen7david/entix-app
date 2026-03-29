import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { createRoute } from "@hono/zod-openapi";
import { socialMediaTypeSchema } from "@shared/schemas/dto/social-media.dto";
import { z } from "zod";

export class SocialMediaRoutes {
    static tags = ["Social Media"];

    static findAll = createRoute({
        tags: SocialMediaRoutes.tags,
        method: HttpMethods.GET,
        path: "/social-media-types",
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.array(socialMediaTypeSchema),
                "List of supported social media platform types"
            ),
        },
    });
}
