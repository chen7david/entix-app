import { z } from "@hono/zod-openapi";
import { baseSchema } from "./base.dto";

export const socialMediaTypeSchema = baseSchema.extend({
    name: z.string().openapi({
        example: "Twitter",
    }),
    image: z.string().nullable().optional().openapi({
        example: "https://example.com/logo.png",
    }),
    description: z.string().nullable().optional().openapi({
        example: "Social media platform for short messages.",
    }),
});

export type SocialMediaTypeDTO = z.infer<typeof socialMediaTypeSchema>;
