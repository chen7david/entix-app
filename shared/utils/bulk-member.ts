import type { OrgRole } from "../auth/permissions";

const IMPORTABLE_ORG_ROLES = new Set<string>(["admin", "student", "teacher", "owner", "finance"]);

/** Legacy / external exports often use `member` instead of an org role. */
const LEGACY_ROLE_ALIASES: Record<string, OrgRole> = {
    member: "student",
    members: "student",
};

/**
 * Normalize a raw bulk-member JSON row so export ↔ import round-trips work.
 * Accepts legacy field names (`phoneNumbers`, `socialMedia`) and roles (`member`).
 */
export function normalizeBulkMemberRaw(raw: unknown): unknown {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return raw;
    }

    const item = { ...(raw as Record<string, unknown>) };

    if (!item.phones && Array.isArray(item.phoneNumbers)) {
        item.phones = item.phoneNumbers;
    }
    delete item.phoneNumbers;

    if (!item.socials && Array.isArray(item.socialMedia)) {
        item.socials = item.socialMedia;
    }
    delete item.socialMedia;

    if (typeof item.role === "string") {
        const lowered = item.role.trim().toLowerCase();
        const aliased = LEGACY_ROLE_ALIASES[lowered] ?? lowered;
        item.role = IMPORTABLE_ORG_ROLES.has(aliased) ? aliased : undefined;
    }

    if (item.avatarUrl === "" || item.avatarUrl === undefined) {
        item.avatarUrl = null;
    } else if (typeof item.avatarUrl === "string") {
        try {
            // Drop non-URL avatar strings so one bad row does not fail the whole batch.
            new URL(item.avatarUrl);
        } catch {
            item.avatarUrl = null;
        }
    }

    if (Array.isArray(item.phones)) {
        item.phones = item.phones.map((phone) => {
            if (!phone || typeof phone !== "object") return phone;
            const p = { ...(phone as Record<string, unknown>) };
            if (p.extension === "") p.extension = null;
            return p;
        });
    }

    return item;
}

export function normalizeBulkMembersRaw(raw: unknown): unknown[] {
    if (!Array.isArray(raw)) {
        throw new Error("JSON must be an array of members");
    }
    return raw.map(normalizeBulkMemberRaw);
}
