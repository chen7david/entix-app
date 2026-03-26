import { z } from '@hono/zod-openapi';
import { OrgRole } from '../../auth/permissions';

const timestampSchema = z.union([z.string(), z.date()]).optional();

/**
 * Schema for bulk member import/export items
 */
export const bulkMemberItemSchema = z.object({
    id: z.string().optional().openapi({ example: 'user_123' }),
    email: z.string().trim().openapi({ example: 'member@example.com' }),
    name: z.string().trim().min(1).openapi({ example: 'John Doe' }),
    role: z.enum(['admin', 'member', 'owner']).optional().openapi({ example: 'member' }),
    avatarUrl: z.string().url().optional().nullable().openapi({ example: 'https://example.com/avatar.jpg' }),
    createdAt: timestampSchema.openapi({ example: '2023-01-01T00:00:00Z' }),
    updatedAt: timestampSchema.openapi({ example: '2023-01-01T00:00:00Z' }),
    profile: z.object({
        id: z.string().optional().openapi({ example: 'prof_123' }),
        firstName: z.string(),
        lastName: z.string(),
        displayName: z.string().optional().nullable().openapi({ example: 'Johnnie' }),
        sex: z.enum(['male', 'female', 'other']),
        birthDate: z.union([z.string(), z.date()]).optional().nullable(),
        createdAt: timestampSchema,
        updatedAt: timestampSchema,
    }).optional().nullable().openapi({ example: { firstName: 'John', lastName: 'Doe', sex: 'male' } }),
    phoneNumbers: z.array(z.object({
        id: z.string().optional(),
        countryCode: z.string(),
        number: z.string(),
        extension: z.string().optional().nullable(),
        label: z.string(),
        isPrimary: z.boolean().default(false),
        createdAt: timestampSchema,
        updatedAt: timestampSchema,
    })).optional().openapi({ example: [{ countryCode: '+1', number: '1234567890', label: 'Work' }] }),
    addresses: z.array(z.object({
        id: z.string().optional(),
        country: z.string(),
        state: z.string(),
        city: z.string(),
        zip: z.string(),
        address: z.string(),
        label: z.string(),
        isPrimary: z.boolean().default(false),
        createdAt: timestampSchema,
        updatedAt: timestampSchema,
    })).optional().openapi({ example: [{ country: 'USA', state: 'NY', city: 'New York', zip: '10001', address: '123 Main St', label: 'Home' }] }),
    socialMedia: z.array(z.object({
        id: z.string().optional(),
        type: z.string(),
        urlOrHandle: z.string(),
        createdAt: timestampSchema,
        updatedAt: timestampSchema,
    })).optional().openapi({ example: [{ type: 'Facebook', urlOrHandle: 'johndoe' }] }),
});

export type BulkMemberItemDTO = z.infer<typeof bulkMemberItemSchema> & {
    role?: OrgRole;
};

/**
 * Schema for bulk metrics response
 */
export const bulkMetricsSchema = z.object({
    totalStorage: z.number().openapi({ example: 1024576 }),
    activeSessions: z.number().openapi({ example: 5 }),
    engagementRisk: z.number().openapi({ example: 2 }),
    totalMembers: z.number().openapi({ example: 50 }),
    upcomingBirthdays: z.array(z.object({
        userId: z.string(),
        name: z.string(),
        birthDate: z.string(),
        daysUntil: z.number(),
    })).openapi({ example: [] }),
});

export type BulkMetricsDTO = z.infer<typeof bulkMetricsSchema>;

/**
 * Schema for import summary response
 */
export const bulkImportResponseSchema = z.object({
    total: z.number().openapi({ example: 10 }),
    created: z.number().openapi({ example: 8 }),
    linked: z.number().openapi({ example: 2 }),
    failed: z.number().openapi({ example: 0 }),
    errors: z.array(z.string()).openapi({ example: [] }),
});

export type BulkImportResponseDTO = z.infer<typeof bulkImportResponseSchema>;
