import { z } from "@hono/zod-openapi";
import { baseSchema } from "./base.dto";

export const organizationSchema = baseSchema.extend({
    name: z.string().openapi({ example: "Organization Name" }),
    slug: z.string().openapi({ example: "organization-name" }),
    logo: z.string().nullable().openapi({ example: "https://example.com/logo.png" }),
    metadata: z.string().nullable().optional().openapi({ example: '{"key": "value"}' }),
});

export const organizationListResponseSchema = z.array(organizationSchema);

export type OrganizationDTO = z.infer<typeof organizationSchema>;
