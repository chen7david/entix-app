/**
 * Sanitizes and wraps a search term with SQL wildcards for LIKE queries.
 * Ensures that and empty search term does not generate a catch-all predicate.
 */
export function wrapWildcard(search: string): string {
    if (!search) return "";
    return `%${search}%`;
}

/**
 * Maps common UI resource categories to MIME-type patterns.
 * Returns null if the category is 'all' or is not recognized.
 */
export function mapCategoryToMimePattern(category: string | undefined | null): string | null {
    if (!category || category === "all") return null;

    const mapping: Record<string, string> = {
        image: "image/%",
        video: "video/%",
        audio: "audio/%",
    };

    return mapping[category] ?? null;
}
