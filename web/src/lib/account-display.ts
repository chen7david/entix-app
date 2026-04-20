function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

/**
 * Standard account label display:
 * - "Savings (CNY)" => "Savings — CNY"
 * - "General Fund" + "CNY" => "General Fund — CNY"
 */
export function formatAccountDisplayName(name: string, currencyCode?: string): string {
    const raw = normalizeWhitespace(name);
    const parenMatch = raw.match(/^(.*)\(([^)]+)\)\s*$/);
    if (parenMatch) {
        const baseName = normalizeWhitespace(parenMatch[1] ?? "");
        const code = normalizeWhitespace(parenMatch[2] ?? "");
        return code ? `${baseName} — ${code}` : baseName;
    }

    if (!currencyCode) return raw;
    if (raw.includes("—")) return raw;

    const code = normalizeWhitespace(currencyCode).toUpperCase();
    if (!code) return raw;
    return `${raw} — ${code}`;
}
