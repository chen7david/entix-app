import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
    organization: ["update", "delete"],
    invitation: ["create", "cancel"],
    member: ["read", "create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
    member: ac.newRole({
        member: ["read"],
    }),
    admin: ac.newRole({
        organization: ["update"],
        invitation: ["create", "cancel"],
        member: ["read", "create", "update", "delete"],
    }),
    owner: ac.newRole({
        organization: ["update", "delete"],
        invitation: ["create", "cancel"],
        member: ["read", "create", "update", "delete"],
    }),
} as const;

export const { member, admin, owner } = roles;

/** Organization-level role. Derived from the `roles` object above. */
export type OrgRole = keyof typeof roles;