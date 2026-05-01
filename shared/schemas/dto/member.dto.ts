import { z } from "@hono/zod-openapi";

export const memberDTOSchema = z.object({
    id: z.string().openapi({ example: "member_123" }),
    organizationId: z.string().openapi({ example: "org_123" }),
    userId: z.string().openapi({ example: "user_123" }),
    role: z.string().openapi({ example: "student" }),
    createdAt: z.union([z.string(), z.date()]).openapi({ example: "2023-01-01T00:00:00Z" }),
    name: z.string().optional().openapi({ example: "John Doe" }),
    email: z.string().optional().openapi({ example: "john@example.com" }),
    avatarUrl: z.string().nullable().optional(),
    emailVerified: z.boolean().optional(),
});

export type MemberDTO = z.infer<typeof memberDTOSchema>;

export const createMemberSchema = z.object({
    email: z.email().openapi({ example: "newmember@example.com" }),
    name: z.string().min(1).openapi({ example: "John Doe" }),
    role: z.string().openapi({ example: "student, admin" }),
    defaultBillingPlanId: z
        .string()
        .optional()
        .openapi({ example: "bp_123", description: "Required when creating student members" }),
});

export type CreateMemberDTO = z.infer<typeof createMemberSchema>;

export const createMemberResponseSchema = z.object({
    data: z.object({
        member: memberDTOSchema,
        user: z.object({
            id: z.string(),
            email: z.string(),
            name: z.string(),
            emailVerified: z.boolean(),
        }),
    }),
});

export type CreateMemberResponseDTO = z.infer<typeof createMemberResponseSchema>;
