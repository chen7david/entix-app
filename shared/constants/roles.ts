import type { OrgRole } from "../auth/permissions";

export const ROLE_COLORS: Record<OrgRole, string> = {
    owner: "gold",
    admin: "blue",
    finance: "cyan",
    teacher: "purple",
    student: "default",
};

/**
 * Org roles that may access org finance UI and manage member wallets.
 * Platform treasury remains super-admin only (`/admin/finance/*`).
 */
export const FINANCE_CAPABLE_ORG_ROLES = [
    "admin",
    "owner",
    "finance",
] as const satisfies readonly OrgRole[];

export type FinanceCapableOrgRole = (typeof FINANCE_CAPABLE_ORG_ROLES)[number];

export function isFinanceCapableOrgRole(role: string | null | undefined): boolean {
    return role === "admin" || role === "owner" || role === "finance";
}

/**
 * True when any comma-separated membership role is finance-capable.
 */
export function membershipHasFinanceAccess(membershipRole: string | undefined): boolean {
    const roles = (membershipRole ?? "")
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
    return roles.some((r) => isFinanceCapableOrgRole(r));
}

/**
 * Single source of truth for all <Select> role inputs across the application.
 */
export const ORG_ROLE_OPTIONS: { value: OrgRole; label: string }[] = [
    { value: "student", label: "Student" },
    { value: "teacher", label: "Teacher" },
    { value: "finance", label: "Finance" },
    { value: "admin", label: "Admin" },
    { value: "owner", label: "Owner" },
];

/**
 * Safely resolves a color for a given role string.
 * Falls back to "default" for unknown or malformed roles.
 */
export const getRoleColor = (role: string): string =>
    role in ROLE_COLORS ? ROLE_COLORS[role as OrgRole] : "default";
