import { z } from '@hono/zod-openapi'
import { baseSchema } from './base.dto'

export const profileBaseSchema = z.object({
    firstName: z.string().openapi({ example: "John" }),
    lastName: z.string().openapi({ example: "Doe" }),
    displayName: z.string().nullable().openapi({ example: "Johnny" }),
    sex: z.enum(["male", "female", "other"]).openapi({ example: "male" }),
    birthDate: z.coerce.date().nullable().openapi({ example: "1990-01-01T00:00:00Z" }),
});

export const profileSchema = baseSchema.extend({
    userId: z.string().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
}).merge(profileBaseSchema);

export const phoneInputSchema = z.object({
    countryCode: z.string().openapi({ example: "+1" }),
    number: z.string().openapi({ example: "5551234567" }),
    extension: z.string().nullable().optional().openapi({ example: "123" }),
    label: z.string().openapi({ example: "Work" }),
    isPrimary: z.boolean().optional().default(false).openapi({ example: true }),
});

export const phoneSchema = baseSchema.merge(phoneInputSchema);

export const addressInputSchema = z.object({
    country: z.string().openapi({ example: "USA" }),
    state: z.string().openapi({ example: "NY" }),
    city: z.string().openapi({ example: "New York" }),
    zip: z.string().openapi({ example: "10001" }),
    address: z.string().openapi({ example: "123 Main St" }),
    label: z.string().openapi({ example: "Home" }),
    isPrimary: z.boolean().optional().default(false).openapi({ example: true }),
});

export const addressSchema = baseSchema.merge(addressInputSchema);

export const socialSchema = baseSchema.extend({
    socialMediaTypeId: z.string().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    urlOrHandle: z.string().openapi({ example: "@johndoe" }),
});

export const aggregateProfileResponse = z.object({
    profile: profileSchema.nullable(),
    phoneNumbers: z.array(phoneSchema),
    addresses: z.array(addressSchema),
    socialMedias: z.array(socialSchema.extend({
        socialMediaType: z.object({
            id: z.string(),
            name: z.string(),
            image: z.string().nullable()
        }).optional()
    })).optional()
});

export type ProfileBaseDTO = z.infer<typeof profileBaseSchema>;
export type ProfileDTO = z.infer<typeof profileSchema>;
export type PhoneDTO = z.infer<typeof phoneSchema>;
export type AddressDTO = z.infer<typeof addressSchema>;
export type SocialDTO = z.infer<typeof socialSchema>;
export type AggregateProfileResponseDTO = z.infer<typeof aggregateProfileResponse>;
