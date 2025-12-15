export * as HttpStatusCodes from 'stoker/http-status-codes'
export { jsonContent, jsonContentRequired } from "stoker/openapi/helpers"

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
