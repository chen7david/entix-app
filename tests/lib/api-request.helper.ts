import type { Hono } from "hono";
import type { AppEnv } from "@api/helpers/types.helpers";
import type { CreateMemberDTO } from "@shared/schemas/dto/member.dto";
import type { SignUpWithOrgDTO } from "@shared/schemas/dto/auth.dto";

/**
 * API request helpers for integration tests
 * These helpers encapsulate common HTTP request patterns for testing endpoints
 */

/**
 * Create a member in an organization
 * 
 * @param app - The Hono app instance
 * @param env - The test environment
 * @param organizationId - The organization ID
 * @param payload - Member creation data
 * @param cookie - Optional session cookie (if not provided, request will be unauthenticated)
 * @returns Response from the API
 */
export async function createMemberRequest(
    app: Hono<AppEnv>,
    env: any,
    organizationId: string,
    payload: CreateMemberDTO,
    cookie?: string
): Promise<Response> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (cookie) {
        headers["Cookie"] = cookie;
    }

    return app.request(`/api/v1/organizations/${organizationId}/members`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    }, env);
}

/**
 * Sign up with organization (creates user + org)
 * 
 * @param app - The Hono app instance
 * @param env - The test environment
 * @param payload - Sign up data
 * @returns Response from the API
 */
export async function signUpWithOrgRequest(
    app: Hono<AppEnv>,
    env: any,
    payload: SignUpWithOrgDTO
): Promise<Response> {
    return app.request("/api/v1/auth/signup-with-org", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    }, env);
}

/**
 * Generic authenticated POST request helper
 * 
 * @param app - The Hono app instance
 * @param env - The test environment
 * @param path - API endpoint path
 * @param body - Request body
 * @param cookie - Session cookie for authentication
 * @returns Response from the API
 */
export async function authenticatedPost<T = any>(
    app: Hono<AppEnv>,
    env: any,
    path: string,
    body: T,
    cookie: string
): Promise<Response> {
    return app.request(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": cookie,
        },
        body: JSON.stringify(body),
    }, env);
}

/**
 * Generic authenticated GET request helper
 * 
 * @param app - The Hono app instance
 * @param env - The test environment
 * @param path - API endpoint path
 * @param cookie - Session cookie for authentication
 * @returns Response from the API
 */
export async function authenticatedGet(
    app: Hono<AppEnv>,
    env: any,
    path: string,
    cookie: string
): Promise<Response> {
    return app.request(path, {
        method: "GET",
        headers: {
            "Cookie": cookie,
        },
    }, env);
}

/**
 * Generic unauthenticated POST request helper
 * 
 * @param app - The Hono app instance
 * @param env - The test environment
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response from the API
 */
export async function unauthenticatedPost<T = any>(
    app: Hono<AppEnv>,
    env: any,
    path: string,
    body: T
): Promise<Response> {
    return app.request(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    }, env);
}
