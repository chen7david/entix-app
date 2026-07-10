import type { DocumentMeta } from "./document.types";

interface DocumentHeaderProps {
    meta: DocumentMeta;
}

export function DocumentHeader({ meta }: DocumentHeaderProps) {
    const formattedDate = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(meta.generatedAt);

    return (
        <header
            className="doc-no-break-after"
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1.5pt solid #1a1a1a",
                paddingBottom: "10pt",
                marginBottom: "16pt",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "10pt" }}>
                {meta.logoUrl && (
                    <img
                        src={meta.logoUrl}
                        alt={meta.orgName}
                        style={{ height: "32pt", width: "auto", objectFit: "contain" }}
                    />
                )}
                <div>
                    <div style={{ fontSize: "13pt", fontWeight: 700, color: "#1a1a1a" }}>
                        {meta.orgName}
                    </div>
                </div>
            </div>

            <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14pt", fontWeight: 700, color: "#1a1a1a" }}>
                    {meta.title}
                </div>
                {meta.subtitle && (
                    <div style={{ fontSize: "10pt", color: "#555", marginTop: "2pt" }}>
                        {meta.subtitle}
                    </div>
                )}
                <div style={{ fontSize: "9pt", color: "#777", marginTop: "4pt" }}>
                    Generated: {formattedDate}
                </div>
            </div>
        </header>
    );
}
