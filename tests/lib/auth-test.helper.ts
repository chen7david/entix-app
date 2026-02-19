import type { Hono } from "hono";
import type { AppEnv } from "@api/helpers/types.helpers";
import type { SignUpWithOrgResponseDTO } from "@shared/schemas/dto/auth.dto";
import type { OrgRole } from "@shared/auth/permissions";
import { createMockSignUpWithOrgPayload } from "../factories/auth.factory";
import { createMockMember } from "../factories/member.factory";
import { drizzle } from "drizzle-orm/d1";
import { user as userTable, member as memberTable } from "@api/db/schema.db";
import { eq } from "drizzle-orm";

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
 */
export async function getAuthCookie(params: {
    app: Hono<AppEnv>;
    env: any;
    user: { email: string; password: string; name?: string };
}): Promise<string> {
    const { app, env, user } = params;

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
 */
export async function createAuthenticatedOrg(params: {
    app: Hono<AppEnv>;
    env: any;
    password?: string;
}): Promise<{
    cookie: string;
    orgId: string;
    orgData: SignUpWithOrgResponseDTO;
}> {
    const { app, env, password = "Password123!" } = params;

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

/**
 * Create a user with known credentials, add them to an org with a
 * specific role via direct DB insert, and return their session cookie.
 *
 * Uses direct DB insertion to bypass the invite/email flow — this is
 * intentional for test setup (not suitable for production code).
 */
export async function createOrgMemberWithRole(params: {
    app: Hono<AppEnv>;
    env: any;
    orgId: string;
    role: OrgRole;
    email: string;
}): Promise<{ cookie: string; userId: string }> {
    const { app, env, orgId, role, email } = params;

    // 1. Sign up + sign in with known password
    const cookie = await getAuthCookie({
        app,
        env,
        user: { email, password: "Password123!", name: `Test ${role}` },
    });

    // 2. Look up user ID from DB
    const db = drizzle(env.DB);
    const [dbUser] = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, email));

    if (!dbUser) throw new Error(`User ${email} not found in DB after sign-up`);

    // 3. Insert membership directly (bypasses invite flow)
    const mockMember = createMockMember({
        organizationId: orgId,
        userId: dbUser.id,
        role,
    });
    await db.insert(memberTable).values(mockMember);

    return { cookie, userId: dbUser.id };
}

/**
 * Create a super admin user (platform-level).
 * Signs up with known credentials, sets `user.role = "admin"` in DB,
 * then re-authenticates so the session reflects the updated role.
 */
export async function createSuperAdmin(params: {
    app: Hono<AppEnv>;
    env: any;
    email?: string;
}): Promise<{ cookie: string; email: string }> {
    const email = params.email ?? `superadmin.${Date.now()}@example.com`;
    const password = "Password123!";

    // Initial sign-up + sign-in
    await getAuthCookie({
        app: params.app,
        env: params.env,
        user: { email, password, name: "Super Admin" },
    });

    // Set user.role = "admin" directly in DB (better-auth admin plugin field)
    const db = drizzle(params.env.DB);
    await db
        .update(userTable)
        .set({ role: "admin" } as Partial<typeof userTable.$inferInsert>)
        .where(eq(userTable.email, email));

    // Re-sign-in directly (NOT via getAuthCookie which calls sign-up again)
    const signInRes = await params.app.request("/api/v1/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
    }, params.env);

    if (!signInRes.ok) {
        throw new Error(`Super admin re-sign-in failed: ${signInRes.status}`);
    }

    return { cookie: extractCookies(signInRes), email };
}

