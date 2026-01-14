export const Role = {
    OWNER: "owner",
    ADMIN: "admin",
    MEMBER: "member",
} as const;

export type Role = typeof Role[keyof typeof Role];

export const Permission = {
    // Organization
    ORG_UPDATE: "organization:update",
    ORG_DELETE: "organization:delete",

    // Members
    MEMBER_ADD: "member:add",
    MEMBER_UPDATE: "member:update",
    MEMBER_REMOVE: "member:remove",

    // Billing
    BILLING_MANAGE: "billing:manage",

    // General
    PROJECT_CREATE: "project:create",
    PROJECT_DELETE: "project:delete",
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

export const RolePermissions: Record<Role, Permission[]> = {
    [Role.OWNER]: [
        Permission.ORG_UPDATE,
        Permission.ORG_DELETE,
        Permission.MEMBER_ADD,
        Permission.MEMBER_UPDATE,
        Permission.MEMBER_REMOVE,
        Permission.BILLING_MANAGE,
        Permission.PROJECT_CREATE,
        Permission.PROJECT_DELETE,
    ],
    [Role.ADMIN]: [
        Permission.ORG_UPDATE,
        Permission.MEMBER_ADD,
        Permission.MEMBER_UPDATE,
        Permission.MEMBER_REMOVE,
        Permission.PROJECT_CREATE,
        Permission.PROJECT_DELETE,
    ],
    [Role.MEMBER]: [
        Permission.PROJECT_CREATE,
    ],
};
