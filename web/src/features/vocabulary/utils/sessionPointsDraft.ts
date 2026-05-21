export const POINTS_DRAFT_STEP = 1;
export const CENTS_PER_POINT = 100;

/** Stable scope for drafts — prefer org URL slug so keys match before server org context hydrates. */
export function getSessionPointsDraftKey(scopeKey: string, sessionId: string) {
    return `session-points-draft:${scopeKey}:${sessionId}`;
}

export function loadSessionPointsDraft(
    storage: Storage | undefined,
    scopeKey: string,
    sessionId: string
): Record<string, number> {
    if (!storage) return {};
    const key = getSessionPointsDraftKey(scopeKey, sessionId);
    const raw = storage.getItem(key);
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return Object.entries(parsed).reduce<Record<string, number>>((acc, [userId, value]) => {
            if (typeof value === "number" && Number.isFinite(value) && value !== 0) {
                acc[userId] = Math.trunc(value);
            }
            return acc;
        }, {});
    } catch {
        return {};
    }
}

export function saveSessionPointsDraft(
    storage: Storage | undefined,
    scopeKey: string,
    sessionId: string,
    draft: Record<string, number>
) {
    if (!storage) return;
    const key = getSessionPointsDraftKey(scopeKey, sessionId);
    const normalized = Object.entries(draft).reduce<Record<string, number>>(
        (acc, [userId, value]) => {
            if (value !== 0) acc[userId] = Math.trunc(value);
            return acc;
        },
        {}
    );
    storage.setItem(key, JSON.stringify(normalized));
}

export function clearSessionPointsDraft(
    storage: Storage | undefined,
    scopeKey: string,
    sessionId: string
) {
    if (!storage) return;
    storage.removeItem(getSessionPointsDraftKey(scopeKey, sessionId));
}

/** Clear slug-scoped and legacy org-id scoped drafts for the same session (after save/reset). */
export function clearSessionPointsDraftAllScopes(
    storage: Storage | undefined,
    slug: string | undefined,
    organizationId: string | undefined,
    sessionId: string
) {
    if (!sessionId) return;
    if (slug) clearSessionPointsDraft(storage, slug, sessionId);
    if (organizationId && organizationId !== slug) {
        clearSessionPointsDraft(storage, organizationId, sessionId);
    }
}

/**
 * Prefer slug-backed draft; if empty, load legacy org-id draft and migrate it under slug when possible.
 */
export function loadSessionPointsDraftMigrating(
    storage: Storage | undefined,
    slug: string | undefined,
    organizationId: string | undefined,
    sessionId: string
): Record<string, number> {
    if (!storage || !sessionId) return {};

    if (slug) {
        const primary = loadSessionPointsDraft(storage, slug, sessionId);
        if (Object.keys(primary).length > 0) return primary;
    }

    if (organizationId) {
        const legacy = loadSessionPointsDraft(storage, organizationId, sessionId);
        if (Object.keys(legacy).length === 0) return {};

        if (slug) {
            saveSessionPointsDraft(storage, slug, sessionId, legacy);
            clearSessionPointsDraft(storage, organizationId, sessionId);
        }
        return legacy;
    }

    return {};
}
