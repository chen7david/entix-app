import type { AppEnv } from "@api/helpers/types.helpers";
import type { Hono } from "hono";
import { createAuthClient } from "./auth.client";
import { createRequester } from "./base-requester";
import { createMediaClient } from "./media.client";
import { createMembersClient } from "./members.client";
import { createScheduleClient } from "./schedule.client";
import { createUsersClient } from "./users.client";

/**
 * Create a domain-specific test client for the API.
 *
 * Encapsulates `app`, `env`, and session cookie so tests
 * focus on domain logic — not HTTP plumbing.
 *
 * @example
 * ```typescript
 * const client = createTestClient(app, env, sessionCookie);
 *
 * // Auth (unauthenticated)
 * const res = await client.auth.signUpWithOrg(payload);
 *
 * // Org-scoped resources
 * const users = await client.orgs.users.list(orgId);
 * const member = await client.orgs.members.create(orgId, payload);
 * ```
 */
export function createTestClient(app: Hono<AppEnv>, env: any, cookie?: string) {
    const request = createRequester(app, env, cookie);

    return {
        auth: createAuthClient(request),
        orgs: {
            members: createMembersClient(request),
            users: createUsersClient(request),
            media: createMediaClient(request),
            schedule: createScheduleClient(request),
        },
        /**
         * Low-level escape hatch for one-off requests
         * not covered by entity clients.
         */
        request,
    };
}

export type TestClient = ReturnType<typeof createTestClient>;

export type { AuthClient } from "./auth.client";
export type { Requester } from "./base-requester";
export type { MediaClient } from "./media.client";
export type { MembersClient } from "./members.client";
export type { UsersClient } from "./users.client";
