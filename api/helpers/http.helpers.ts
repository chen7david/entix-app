export * as HttpStatusCodes from 'stoker/http-status-codes'
import type { ZodSchema } from "zod";

export const jsonContent = <T extends ZodSchema>(schema: T, description: string) => {
    return {
        content: {
            "application/json": {
                schema,
            },
        },
        description,
    };
};

export const jsonContentRequired = <T extends ZodSchema>(schema: T, description: string) => {
    return {
        ...jsonContent(schema, description),
        required: true,
    };
};

export const HttpMethods = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
    PATCH: 'patch',
    HEAD: 'head',
    OPTIONS: 'options',
    TRACE: 'trace',
    CONNECT: 'connect',
} as const
