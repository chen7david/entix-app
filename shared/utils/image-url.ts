/**
 * Image URL Service
 *
 * Generates Cloudflare-compatible image transformation URLs.
 * When Cloudflare Image Transformations are enabled, URLs use the
 * `/cdn-cgi/image/` prefix for on-the-fly resizing, format conversion, etc.
 *
 * When transformations are not available (free tier without Images plan),
 * the raw R2 URL is returned as-is.
 *
 * @example
 * // With transformations enabled:
 * getImageUrl("https://media.example.com/org123/avatar.jpg", { width: 150, height: 150, fit: "cover" })
 * // => "https://media.example.com/cdn-cgi/image/width=150,height=150,fit=cover/org123/avatar.jpg"
 *
 * // Without transformations (fallback):
 * getImageUrl("https://media.example.com/org123/avatar.jpg", { width: 150 })
 * // => "https://media.example.com/org123/avatar.jpg"
 */

export type ImageTransformOptions = {
    /** Target width in pixels */
    width?: number;
    /** Target height in pixels */
    height?: number;
    /** Resize fit mode: cover (crop), contain (letterbox), scale-down, pad */
    fit?: "cover" | "contain" | "scale-down" | "pad";
    /** Output quality 1-100 (for lossy formats) */
    quality?: number;
    /** Force output format */
    format?: "webp" | "avif" | "jpeg" | "png";
    /** DPR (device pixel ratio) multiplier */
    dpr?: number;
};

/**
 * Common avatar size presets for consistent caching.
 * Using standardized sizes helps maximize Cloudflare cache hits
 * and minimize transformation count against the monthly quota.
 */
export const AVATAR_PRESETS = {
    /** Tiny avatar for lists and comments (32x32) */
    xs: { width: 32, height: 32, fit: "cover" as const },
    /** Small avatar for table rows (40x40) */
    sm: { width: 40, height: 40, fit: "cover" as const },
    /** Medium avatar for cards and profiles (80x80) */
    md: { width: 80, height: 80, fit: "cover" as const },
    /** Large avatar for profile pages (200x200) */
    lg: { width: 200, height: 200, fit: "cover" as const },
    /** Extra large for hero/banner (400x400) */
    xl: { width: 400, height: 400, fit: "cover" as const },
} as const;

/**
 * Builds the full URL by ensuring protocol and correct joining.
 * Since the backend now dictates the base URL via DB storage, this primarily
 * ensures no protocol-less domains are mistakenly evaluated as relative routes.
 */
function buildFullUrl(pathOrUrl: string): string {
    if (!pathOrUrl) return "";

    // If it lacks a protocol but looks like a domain, prepend https://
    if (!pathOrUrl.startsWith("http://") && !pathOrUrl.startsWith("https://") && !pathOrUrl.startsWith("//")) {
        const firstSegment = pathOrUrl.split('/')[0];
        if (firstSegment.includes('.')) {
            return `https://${pathOrUrl}`;
        }
    }

    return pathOrUrl;
}

/**
 * Generates a Cloudflare Image Transformation URL from a base image URL or path.
 *
 * @param pathOrUrl - The relative path (bucketKey) or full URL of the image
 * @param options - Transformation options (width, height, fit, quality, format)
 * @param enableTransformations - Whether Cloudflare Image Transformations are active
 * @returns The transformed URL (or absolute URL if transforms are disabled)
 */
export function getImageUrl(
    pathOrUrl: string,
    options?: ImageTransformOptions,
    enableTransformations: boolean = import.meta.env?.VITE_ENABLE_CF_IMAGES === "true"
): string {
    if (!pathOrUrl) return "";

    const baseUrl = buildFullUrl(pathOrUrl);

    if (!options || !enableTransformations) return baseUrl;

    // Build the transformation parameters string
    const params: string[] = [];
    if (options.width) params.push(`width=${options.width}`);
    if (options.height) params.push(`height=${options.height}`);
    if (options.fit) params.push(`fit=${options.fit}`);
    if (options.quality) params.push(`quality=${options.quality}`);
    if (options.format) params.push(`format=${options.format}`);
    if (options.dpr) params.push(`dpr=${options.dpr}`);

    if (params.length === 0) return baseUrl;

    // Parse the URL to insert the /cdn-cgi/image/ segment
    try {
        const url = new URL(baseUrl);
        const transformPath = `/cdn-cgi/image/${params.join(",")}`;
        return `${url.origin}${transformPath}${url.pathname}`;
    } catch {
        // If URL parsing fails, return the original
        return baseUrl;
    }
}

/**
 * Convenience function for getting an absolute asset URL (no transformations).
 * Useful for non-image uploads (PDFs, docs).
 */
export function getAssetUrl(pathOrUrl: string): string {
    if (!pathOrUrl) return "";
    return buildFullUrl(pathOrUrl);
}

/**
 * Convenience function for getting an avatar URL with a preset size.
 *
 * @param baseUrl - The user's image URL (from user.image)
 * @param preset - One of the standard avatar presets (xs, sm, md, lg, xl)
 * @param enableTransformations - Whether Cloudflare Image Transformations are active
 */
export function getAvatarUrl(
    baseUrl: string | null | undefined,
    preset: keyof typeof AVATAR_PRESETS = "md",
    enableTransformations: boolean = import.meta.env?.VITE_ENABLE_CF_IMAGES === "true"
): string {
    if (!baseUrl) return "";
    return getImageUrl(baseUrl, AVATAR_PRESETS[preset], enableTransformations);
}
