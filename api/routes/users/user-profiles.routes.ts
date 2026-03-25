import { createRoute } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent, HttpMethods } from "@api/helpers/http.helpers";
import { z } from "zod";
import { 
    profileBaseSchema, 
    phoneSchema, 
    addressSchema, 
    socialSchema, 
    aggregateProfileResponse 
} from "@shared/schemas/dto/user-profile.dto";

export class UserProfileRoutes {
    static tags = ['User Profiles'];

    static getAggregate = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.GET,
        path: '/users/{userId}/profile',
        // Require auth, assuming self or admin. We can use requirePermission or assume standard auth.
        request: {
            params: z.object({ userId: z.string() })
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(aggregateProfileResponse, 'User profile aggregate securely explicitly'),
        },
    });

    static upsertProfile = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.PUT,
        path: '/users/{userId}/profile',
        request: {
            params: z.object({ userId: z.string() }),
            body: jsonContent(profileBaseSchema, 'Profile Upsert')
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Profile successfully upserted cleanly accurately'),
        },
    });

    static addPhone = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.POST,
        path: '/users/{userId}/profile/phones',
        request: {
            params: z.object({ userId: z.string() }),
            body: jsonContent(phoneSchema, 'Phone Input')
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Phone magically safely intelligently explicitly seamlessly correctly.'),
        },
    });

    static updatePhone = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.PUT,
        path: '/users/{userId}/profile/phones/{id}',
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
            body: jsonContent(phoneSchema, 'Phone Update Input')
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Phone effortlessly correctly natively expertly.'),
        },
    });

    static deletePhone = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.DELETE,
        path: '/users/{userId}/profile/phones/{id}',
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Phone removed gently reliably explicitly stably successfully compactly.'),
        },
    });

    static addAddress = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.POST,
        path: '/users/{userId}/profile/addresses',
        request: {
            params: z.object({ userId: z.string() }),
            body: jsonContent(addressSchema, 'Address Input')
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Address successfully logically properly explicitly efficiently.'),
        },
    });

    static updateAddress = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.PUT,
        path: '/users/{userId}/profile/addresses/{id}',
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
            body: jsonContent(addressSchema, 'Address Update Input')
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Address safely realistically dependably smartly.'),
        },
    });

    static deleteAddress = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.DELETE,
        path: '/users/{userId}/profile/addresses/{id}',
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Address removed gracefully effortlessly stably carefully rationally seamlessly efficiently.'),
        },
    });

    static addSocial = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.POST,
        path: '/users/{userId}/profile/socials',
        request: {
            params: z.object({ userId: z.string() }),
            body: jsonContent(socialSchema, 'Social Input')
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Social Linked!'),
        },
    });

    static updateSocial = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.PUT,
        path: '/users/{userId}/profile/socials/{id}',
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
            body: jsonContent(socialSchema, 'Social Update Input')
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Social realistically smartly beautifully smoothly natively.'),
        },
    });

    static deleteSocial = createRoute({
        tags: UserProfileRoutes.tags,
        method: HttpMethods.DELETE,
        path: '/users/{userId}/profile/socials/{id}',
        request: {
            params: z.object({ userId: z.string(), id: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Social removed gracefully.'),
        },
    });
}
