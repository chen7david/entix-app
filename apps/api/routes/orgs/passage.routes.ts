import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import { PASSAGE_TYPES } from "@shared/db/schema/passages.schema";
import { TEXT_COLLECTION_TYPES } from "@shared/db/schema/text-collections.schema";
import {
    AddPassageImageSchema,
    CreateCollectionSchema,
    CreatePassageSchema,
    PassageDtoSchema,
    PassageImageDtoSchema,
    PassageWithContentDtoSchema,
    TextCollectionDtoSchema,
    UpdateCollectionSchema,
    UpdatePassageSchema,
} from "@shared/schemas/dto/passage.dto";
import { PaginatedDataSchema, PaginationQuerySchema } from "@shared/schemas/pagination.schema";

const OrgParamsSchema = z.object({ organizationId: z.string() });
const PassageParamsSchema = OrgParamsSchema.extend({ passageId: z.string() });
const CollectionParamsSchema = OrgParamsSchema.extend({ collectionId: z.string() });
const PassageImageParamsSchema = PassageParamsSchema.extend({ imageId: z.string() });

const NotFoundResponse = jsonContent(z.object({ message: z.string() }), "Not found");

export const PassageRoutes = {
    listPassages: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/passages",
        tags: ["Passages"],
        middleware: [requirePermission("passage", ["read"])] as const,
        request: {
            params: OrgParamsSchema,
            query: PaginationQuerySchema.extend({
                collectionId: z.string().optional(),
                type: z.enum(PASSAGE_TYPES).optional(),
                cefrLevel: z.string().optional(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: PaginatedDataSchema(PassageDtoSchema),
                    },
                },
                description: "List passages",
            },
        },
    }),
    createPassage: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/passages",
        tags: ["Passages"],
        middleware: [requirePermission("passage", ["create"])] as const,
        request: {
            params: OrgParamsSchema,
            body: { content: { "application/json": { schema: CreatePassageSchema } } },
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                z.object({ data: PassageDtoSchema }),
                "Passage created"
            ),
        },
    }),
    getPassage: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/passages/{passageId}",
        tags: ["Passages"],
        middleware: [requirePermission("passage", ["read"])] as const,
        request: { params: PassageParamsSchema },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({ data: PassageWithContentDtoSchema }),
                "Passage with content and images"
            ),
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    updatePassage: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/passages/{passageId}",
        tags: ["Passages"],
        middleware: [requirePermission("passage", ["update"])] as const,
        request: {
            params: PassageParamsSchema,
            body: { content: { "application/json": { schema: UpdatePassageSchema } } },
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({ data: PassageDtoSchema }),
                "Passage updated"
            ),
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    deletePassage: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/passages/{passageId}",
        tags: ["Passages"],
        middleware: [requirePermission("passage", ["delete"])] as const,
        request: { params: PassageParamsSchema },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: { description: "Passage deleted" },
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    listPassageImages: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/passages/{passageId}/images",
        tags: ["Passages"],
        middleware: [requirePermission("passage", ["read"])] as const,
        request: { params: PassageParamsSchema },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({ data: z.array(PassageImageDtoSchema) }),
                    },
                },
                description: "List passage images",
            },
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    addPassageImage: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/passages/{passageId}/images",
        tags: ["Passages"],
        middleware: [requirePermission("passage", ["update"])] as const,
        request: {
            params: PassageParamsSchema,
            body: { content: { "application/json": { schema: AddPassageImageSchema } } },
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                z.object({ data: PassageImageDtoSchema }),
                "Image linked to passage"
            ),
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    deletePassageImage: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/passages/{passageId}/images/{imageId}",
        tags: ["Passages"],
        middleware: [requirePermission("passage", ["update"])] as const,
        request: { params: PassageImageParamsSchema },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: { description: "Passage image removed" },
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    listCollections: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/text-collections",
        tags: ["Text Collections"],
        middleware: [requirePermission("passage", ["read"])] as const,
        request: {
            params: OrgParamsSchema,
            query: PaginationQuerySchema.extend({
                type: z.enum(TEXT_COLLECTION_TYPES).optional(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: PaginatedDataSchema(TextCollectionDtoSchema),
                    },
                },
                description: "List text collections",
            },
        },
    }),
    createCollection: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/text-collections",
        tags: ["Text Collections"],
        middleware: [requirePermission("passage", ["create"])] as const,
        request: {
            params: OrgParamsSchema,
            body: { content: { "application/json": { schema: CreateCollectionSchema } } },
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                z.object({ data: TextCollectionDtoSchema }),
                "Text collection created"
            ),
        },
    }),
    getCollection: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/text-collections/{collectionId}",
        tags: ["Text Collections"],
        middleware: [requirePermission("passage", ["read"])] as const,
        request: { params: CollectionParamsSchema },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({ data: TextCollectionDtoSchema }),
                "Text collection"
            ),
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    updateCollection: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/text-collections/{collectionId}",
        tags: ["Text Collections"],
        middleware: [requirePermission("passage", ["update"])] as const,
        request: {
            params: CollectionParamsSchema,
            body: { content: { "application/json": { schema: UpdateCollectionSchema } } },
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({ data: TextCollectionDtoSchema }),
                "Text collection updated"
            ),
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    deleteCollection: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/text-collections/{collectionId}",
        tags: ["Text Collections"],
        middleware: [requirePermission("passage", ["delete"])] as const,
        request: { params: CollectionParamsSchema },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: { description: "Text collection deleted" },
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
};
