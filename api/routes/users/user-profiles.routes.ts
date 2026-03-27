import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute } from "@hono/zod-openapi";
import { successResponseSchema } from "@shared/schemas/dto/base.dto";
import {
    addressInputSchema,
    aggregateProfileResponse,
    phoneInputSchema,
    profileBaseSchema,
    socialInputSchema,
} from "@shared/schemas/dto/user-profile.dto";
import { z } from "zod";

export class UserProfileRoutes {
    static tags = ["User Profiles"];

    static getAggregate = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.GET,
        path: "/users/{userId}/profile",
        middleware: [requirePermission("user-profile", ["read"], "userId")] as const,
        request: {
            params: z.object({ userId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                aggregateProfileResponse,
                "User profile with phones, addresses, and socials"
            ),
        },
    });

    static upsertProfile = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.PUT,
        path: "/users/{userId}/profile",
        middleware: [requirePermission("user-profile", ["update"], "userId")] as const,
        request: {
            params: z.object({ userId: z.string() }),
            body: jsonContent(profileBaseSchema, "Profile Upsert"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(successResponseSchema, "Profile upserted"),
        },
    });

    static addPhone = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.POST,
        path: "/users/{userId}/profile/phones",
        middleware: [requirePermission("user-profile", ["update"], "userId")] as const,
        request: {
            params: z.object({ userId: z.string() }),
            body: jsonContent(phoneInputSchema, "Phone Input"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(successResponseSchema, "Phone number added"),
        },
    });

    static updatePhone = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.PUT,
        path: "/users/{userId}/profile/phones/{id}",
        middleware: [requirePermission("user-profile", ["update"], "userId")] as const,
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
            body: jsonContent(phoneInputSchema, "Phone Update Input"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(successResponseSchema, "Phone number updated"),
        },
    });

    static deletePhone = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.DELETE,
        path: "/users/{userId}/profile/phones/{id}",
        middleware: [requirePermission("user-profile", ["update"], "userId")] as const,
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(successResponseSchema, "Phone number deleted"),
        },
    });

    static addAddress = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.POST,
        path: "/users/{userId}/profile/addresses",
        middleware: [requirePermission("user-profile", ["update"], "userId")] as const,
        request: {
            params: z.object({ userId: z.string() }),
            body: jsonContent(addressInputSchema, "Address Input"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(successResponseSchema, "Address added"),
        },
    });

    static updateAddress = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.PUT,
        path: "/users/{userId}/profile/addresses/{id}",
        middleware: [requirePermission("user-profile", ["update"], "userId")] as const,
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
            body: jsonContent(addressInputSchema, "Address Update Input"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(successResponseSchema, "Address updated"),
        },
    });

    static deleteAddress = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.DELETE,
        path: "/users/{userId}/profile/addresses/{id}",
        middleware: [requirePermission("user-profile", ["update"], "userId")] as const,
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(successResponseSchema, "Address deleted"),
        },
    });

    static addSocial = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.POST,
        path: "/users/{userId}/profile/socials",
        middleware: [requirePermission("user-profile", ["update"], "userId")] as const,
        request: {
            params: z.object({ userId: z.string() }),
            body: jsonContent(socialInputSchema, "Social Input"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(successResponseSchema, "Social handle linked"),
        },
    });

    static updateSocial = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.PUT,
        path: "/users/{userId}/profile/socials/{id}",
        middleware: [requirePermission("user-profile", ["update"], "userId")] as const,
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
            body: jsonContent(socialInputSchema, "Social Update Input"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(successResponseSchema, "Social handle updated"),
        },
    });

    static deleteSocial = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.DELETE,
        path: "/users/{userId}/profile/socials/{id}",
        middleware: [requirePermission("user-profile", ["update"], "userId")] as const,
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(successResponseSchema, "Social handle deleted"),
        },
    });
}
