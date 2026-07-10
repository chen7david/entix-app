/** Minimal contract every document template satisfies; templates extend their own data types. */
export interface DocumentMeta {
    title: string;
    subtitle?: string;
    orgName: string;
    logoUrl?: string;
    generatedAt: Date;
}
