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
 */
export async function createMemberRequest(params: {
    app: Hono<AppEnv>;
    env: any;
    organizationId: string;
    payload: CreateMemberDTO;
    cookie?: string;
}): Promise<Response> {
    const { app, env, organizationId, payload, cookie } = params;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (cookie) {
        headers["Cookie"] = cookie;
    }

    return app.request(`/api/v1/orgs/${organizationId}/members`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    }, env);
}

/**
 * Sign up with organization (creates user + org)
 */
export async function signUpWithOrgRequest(params: {
    app: Hono<AppEnv>;
    env: any;
    payload: SignUpWithOrgDTO;
}): Promise<Response> {
    const { app, env, payload } = params;

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
 */
export async function authenticatedPost<T = any>(params: {
    app: Hono<AppEnv>;
    env: any;
    path: string;
    body: T;
    cookie: string;
}): Promise<Response> {
    const { app, env, path, body, cookie } = params;

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
 */
export async function authenticatedGet(params: {
    app: Hono<AppEnv>;
    env: any;
    path: string;
    cookie: string;
}): Promise<Response> {
    const { app, env, path, cookie } = params;

    return app.request(path, {
        method: "GET",
        headers: {
            "Cookie": cookie,
        },
    }, env);
}

/**
 * Generic unauthenticated POST request helper
 */
export async function unauthenticatedPost<T = any>(params: {
    app: Hono<AppEnv>;
    env: any;
    path: string;
    body: T;
}): Promise<Response> {
    const { app, env, path, body } = params;

    return app.request(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    }, env);
}

/**
 * Type-safe JSON parser for test responses
 * Usage: const body = await parseJson<MyDTO>(response);
 */
export async function parseJson<T>(response: Response): Promise<T> {
    return await response.json() as T;
}

/**
 * Type for standard error response
 */
export type ErrorResponse = {
    success: false;
    message: string;
    details?: Record<string, unknown>;
};

