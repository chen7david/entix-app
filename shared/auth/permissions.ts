import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from 'better-auth/plugins/organization/access'

export const statement = {
    ...defaultStatements,
    "organization": ["update", "delete"],
    "invitation": ["create", "cancel"],
    "member": ["read", "create", "update", "delete"],
    "upload": ["read", "create", "update", "delete"],
    "media": ["read", "create", "update", "delete"],
    "social-media-type": ["read", "create", "update", "delete"],
    "user-profile": ["read", "update"],
    "schedule": ["read", "create", "update", "delete"],
    "playlist": ["read", "create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
    member: ac.newRole({
        "member": ["read"],
        "upload": ["read", "create", "update"],
        "media": ["read"],
        "user-profile": ["read", "update"],
        "schedule": ["read"],
        "playlist": ["read"],
    }),
    admin: ac.newRole({
        "organization": ["update"],
        "invitation": ["create", "cancel"],
        "member": ["read", "create", "update", "delete"],
        "upload": ["read", "create", "update", "delete"],
        "media": ["read", "create", "update", "delete"],
        "social-media-type": ["read", "create", "update", "delete"],
        "user-profile": ["read", "update"],
        "schedule": ["read", "create", "update", "delete"],
        "playlist": ["read", "create", "update", "delete"],
    }),
    owner: ac.newRole({
        "organization": ["update", "delete"],
        "invitation": ["create", "cancel"],
        "member": ["read", "create", "update", "delete"],
        "upload": ["read", "create", "update", "delete"],
        "media": ["read", "create", "update", "delete"],
        "social-media-type": ["read", "create", "update", "delete"],
        "user-profile": ["read", "update"],
        "schedule": ["read", "create", "update", "delete"],
        "playlist": ["read", "create", "update", "delete"],
    }),
};

export const { member, admin, owner } = roles;

/** Organization-level role. Derived from the `roles` object above. */
export type OrgRole = keyof typeof roles;