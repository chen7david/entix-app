import type { Hono } from "hono";
import type { AppEnv } from "@api/helpers/types.helpers";
import type { SignUpWithOrgResponseDTO } from "@shared/schemas/dto/auth.dto";
import { createMockSignUpWithOrgPayload } from "../factories/auth.factory";

/**
 * Extract cookies from a Response object
 * Handles both Workers runtime (with getSetCookie) and standard fetch API
 * 
 * @param response - The Response object containing Set-Cookie headers
 * @returns Cookie string ready to use in Cookie header (e.g., "name1=value1; name2=value2")
 */
export function extractCookies(response: Response): string {
    const headers = response.headers as Headers & {
        getSetCookie?: () => string[];
    };

    const setCookies = typeof headers.getSetCookie === "function"
        ? headers.getSetCookie()
        : [headers.get("set-cookie")].filter(Boolean) as string[];

    if (!setCookies.length) {
        throw new Error("No Set-Cookie headers found in response");
    }

    // Return only cookie name=value pairs (strip attributes like Max-Age, Path, etc.)
    return setCookies.map((c) => c.split(";")[0]).join("; ");
}

/**
 * Get an authenticated session cookie for a user
 * Creates the user if they don't exist, then signs them in
 * 
 * @param app - The Hono app instance
 * @param env - The test environment
 * @param user - User credentials (email, password, optional name)
 * @returns Session cookie string ready to use in Cookie header
 */
export async function getAuthCookie(
    app: Hono<AppEnv>,
    env: any,
    user: { email: string; password: string; name?: string }
): Promise<string> {
    // Sign up user (ignores if already exists)
    await app.request(
        "/api/v1/auth/sign-up/email",
        {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                email: user.email,
                password: user.password,
                name: user.name ?? "Test User",
            }),
        },
        env,
    );

    // Sign in to get session cookie
    const signInRes = await app.request(
        "/api/v1/auth/sign-in/email",
        {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: user.email, password: user.password }),
        },
        env,
    );

    if (!signInRes.ok) {
        throw new Error(`sign-in failed: ${signInRes.status} ${await signInRes.text()}`);
    }

    return extractCookies(signInRes);
}

/**
 * Create an authenticated organization with owner session
 * Performs signup-with-org and returns both the session cookie and org details
 * 
 * @param app - The Hono app instance
 * @param env - The test environment
 * @param password - Password for the owner account (default: "Password123!")
 * @returns Object containing session cookie, org ID, and full org data
 */
export async function createAuthenticatedOrg(
    app: Hono<AppEnv>,
    env: any,
    password: string = "Password123!"
): Promise<{
    cookie: string;
    orgId: string;
    orgData: SignUpWithOrgResponseDTO;
}> {
    const orgPayload = createMockSignUpWithOrgPayload({ password });

    // Create org and user via signup-with-org
    const orgRes = await app.request("/api/v1/auth/signup-with-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgPayload),
    }, env);

    if (!orgRes.ok) {
        throw new Error("Failed to create org: " + await orgRes.text());
    }

    const orgData = await orgRes.json() as SignUpWithOrgResponseDTO;

    // Sign in to get session cookie
    const signInRes = await app.request("/api/v1/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: orgPayload.email,
            password,
        }),
    }, env);

    if (!signInRes.ok) {
        throw new Error("Sign-in failed: " + await signInRes.text());
    }

    return {
        cookie: extractCookies(signInRes),
        orgId: orgData.organization.id,
        orgData,
    };
}
