import type { ReactNode } from "react";
import { DocumentFooter } from "./DocumentFooter";
import { DocumentHeader } from "./DocumentHeader";
import type { DocumentMeta } from "./document.types";

interface DocumentLayoutProps {
    meta: DocumentMeta;
    children: ReactNode;
}

export function DocumentLayout({ meta, children }: DocumentLayoutProps) {
    return (
        <div
            className="doc-layout"
            style={{
                fontFamily: "Inter, Roboto, Arial, sans-serif",
                /** Hard-reset every property that could mirror or rotate
                 * inherited content from the host app's CSS or theme. */
                direction: "ltr",
                unicodeBidi: "isolate",
                transform: "none",
                writingMode: "horizontal-tb",
                textAlign: "left",
            }}
        >
            <DocumentHeader meta={meta} />
            <main className="doc-body" style={{ padding: "0" }}>
                {children}
            </main>
            <DocumentFooter />
        </div>
    );
}
