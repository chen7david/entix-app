import { z } from '@hono/zod-openapi'

export const createMemberSchema = z.object({
    email: z.string().email().openapi({ example: 'newmember@example.com' }),
    name: z.string().min(1).openapi({ example: 'John Doe' }),
    role: z.string().min(1).openapi({ example: 'member' }),
});

export type CreateMemberDTO = z.infer<typeof createMemberSchema>;

export const createMemberResponseSchema = z.object({
    member: z.object({
        id: z.string(),
        userId: z.string(),
        organizationId: z.string(),
        role: z.string(),
        createdAt: z.date(),
    }),
    user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string(),
        emailVerified: z.boolean(),
    }),
});

export type CreateMemberResponseDTO = z.infer<typeof createMemberResponseSchema>;
