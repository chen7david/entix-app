import type { CSSProperties, ReactNode } from "react";

interface DocumentSectionProps {
    children: ReactNode;
    style?: CSSProperties;
}

export function DocumentSection({ children, style }: DocumentSectionProps) {
    return (
        <div className="doc-section" style={style}>
            {children}
        </div>
    );
}
