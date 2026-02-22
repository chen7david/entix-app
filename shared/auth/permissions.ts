import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
    project: ["create", "share", "update", "delete"],
    invitation: ["create", "cancel"],
    member: ["create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
    member: ac.newRole({
        project: ["create"],
    }),
    admin: ac.newRole({
        project: ["create", "update"],
        invitation: ["create", "cancel"],
        member: ["create", "update", "delete"],
    }),
    owner: ac.newRole({
        project: ["create", "update", "delete"],
        invitation: ["create", "cancel"],
        member: ["create", "update", "delete"],
    }),
} as const;

export const { member, admin, owner } = roles;

/** Organization-level role. Derived from the `roles` object above. */
export type OrgRole = keyof typeof roles;