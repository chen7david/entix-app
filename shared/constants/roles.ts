import type { OrgRole } from "../auth/permissions";

export const ROLE_COLORS: Record<OrgRole, string> = {
    owner: "gold",
    admin: "blue",
    teacher: "purple",
    student: "default",
};

/**
 * Single source of truth for all <Select> role inputs across the application.
 */
export const ORG_ROLE_OPTIONS: { value: OrgRole; label: string }[] = [
    { value: "student", label: "Student" },
    { value: "teacher", label: "Teacher" },
    { value: "admin", label: "Admin" },
    { value: "owner", label: "Owner" },
];

/**
 * Safely resolves a color for a given role string.
 * Falls back to "default" for unknown or malformed roles.
 */
export const getRoleColor = (role: string): string =>
    role in ROLE_COLORS ? ROLE_COLORS[role as OrgRole] : "default";
