/**
 * `auth_members.role` is a single SQLite text column. The app stores one role or a
 * comma-separated list (e.g. `"student"`, `"teacher"`, `"student,teacher"`).
 */
export function parseAuthMemberRoles(role: string | null | undefined): string[] {
    if (!role?.trim()) return [];
    return role
        .split(",")
        .map((r) => r.trim().toLowerCase())
        .filter(Boolean);
}
