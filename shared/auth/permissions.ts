import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from 'better-auth/plugins/organization/access'

export const statement = {
    ...defaultStatements,
    organization: ["update", "delete"],
    invitation: ["create", "cancel"],
    member: ["read", "create", "update", "delete"],
    upload: ["read", "create", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
    member: ac.newRole({
        member: ["read"],
        upload: ["read", "create"],
    }),
    admin: ac.newRole({
        organization: ["update"],
        invitation: ["create", "cancel"],
        member: ["read", "create", "update", "delete"],
        upload: ["read", "create", "delete"],
    }),
    owner: ac.newRole({
        organization: ["update", "delete"],
        invitation: ["create", "cancel"],
        member: ["read", "create", "update", "delete"],
        upload: ["read", "create", "delete"],
    }),
} as const;

export const { member, admin, owner } = roles;

/** Organization-level role. Derived from the `roles` object above. */
export type OrgRole = keyof typeof roles;