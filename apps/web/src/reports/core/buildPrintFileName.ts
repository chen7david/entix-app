/**
 * Builds the suggested PDF filename for printable documents.
 *
 * Format: `YYMMDD <primary> - <secondary>` (the browser appends `.pdf`
 * automatically when "Save as PDF" is selected).
 *
 * Example: `260508 Tonson Liang - Seven Continents`
 */
export function buildPrintFileName(
    primary: string,
    secondary: string,
    date: Date = new Date()
): string {
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const datePrefix = `${yy}${mm}${dd}`;

    /** Strip characters that are invalid in filenames on Windows/macOS and
     * collapse runs of whitespace so the result is shell-safe. */
    const sanitize = (s: string) =>
        s
            .replace(/[/\\:*?"<>|]/g, "")
            .replace(/\s+/g, " ")
            .trim();

    return `${datePrefix} ${sanitize(primary)} - ${sanitize(secondary)}`;
}
