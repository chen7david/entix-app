type Props = { value: string | null | undefined };

/**
 * Stored IPA omits wrapping slashes (see vocabulary pipeline normalization); conventional display wraps with /…/.
 */
export function IpaBracketed({ value }: Props) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed) return <span className="ipa">—</span>;
    return <span className="ipa">{`/${trimmed}/`}</span>;
}
