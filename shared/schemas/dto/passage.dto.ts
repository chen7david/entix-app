import { z } from "zod";
import { IMAGE_POSITIONS, PASSAGE_TYPES, TEXT_COLLECTION_TYPES } from "../../constants/passage";

export const CreatePassageSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    type: z.enum(PASSAGE_TYPES).default("reading"),
    collectionId: z.string().nullable().optional(),
    cefrLevel: z.string().optional(),
    content: z.string().max(50_000).optional(),
    pageNumber: z.number().int().positive().optional(),
    bucketKey: z.string().optional(),
});

export const UpdatePassageSchema = CreatePassageSchema.partial();

export const CreateCollectionSchema = z.object({
    title: z.string().min(1).max(255),
    type: z.enum(TEXT_COLLECTION_TYPES).default("book"),
    author: z.string().optional(),
    description: z.string().max(2000).optional(),
    cefrLevel: z.string().optional(),
});

export const UpdateCollectionSchema = CreateCollectionSchema.partial();

export const AddPassageImageSchema = z.object({
    uploadId: z.string(),
    altText: z.string().optional(),
    caption: z.string().optional(),
    position: z.enum(IMAGE_POSITIONS).default("bottom"),
    sortOrder: z.number().int().min(0).default(0),
});

export const PassageImageDtoSchema = z.object({
    id: z.string(),
    passageId: z.string(),
    uploadId: z.string().nullable(),
    imageUrl: z.string(),
    altText: z.string().nullable(),
    caption: z.string().nullable(),
    position: z.enum(IMAGE_POSITIONS),
    sortOrder: z.number(),
    createdAt: z.coerce.number(),
});

export const PassageDtoSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    collectionId: z.string().nullable(),
    title: z.string().nullable(),
    type: z.enum(PASSAGE_TYPES),
    cefrLevel: z.string().nullable(),
    content: z.string().nullable().optional(),
    bucketKey: z.string().nullable(),
    r2Url: z.string().nullable(),
    pageNumber: z.number().nullable(),
    wordCount: z.number().nullable(),
    createdAt: z.coerce.number(),
    updatedAt: z.coerce.number(),
});

export const PassageWithContentDtoSchema = PassageDtoSchema.extend({
    content: z.string().nullable(),
    images: z.array(PassageImageDtoSchema),
});

export const TextCollectionDtoSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    title: z.string(),
    author: z.string().nullable(),
    description: z.string().nullable(),
    type: z.enum(TEXT_COLLECTION_TYPES),
    cefrLevel: z.string().nullable(),
    bucketKey: z.string().nullable(),
    r2Url: z.string().nullable(),
    totalPages: z.number().nullable(),
    createdAt: z.coerce.number(),
    updatedAt: z.coerce.number(),
});

export type CreatePassageInput = z.infer<typeof CreatePassageSchema>;
export type UpdatePassageInput = z.infer<typeof UpdatePassageSchema>;
export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>;
export type AddPassageImageInput = z.infer<typeof AddPassageImageSchema>;
export type PassageDto = z.infer<typeof PassageDtoSchema>;
export type PassageWithContentDto = z.infer<typeof PassageWithContentDtoSchema>;
export type PassageImageDto = z.infer<typeof PassageImageDtoSchema>;
export type TextCollectionDto = z.infer<typeof TextCollectionDtoSchema>;
