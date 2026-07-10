import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface PrintPortalProps {
    children: ReactNode;
}

export function PrintPortal({ children }: PrintPortalProps) {
    const el = document.getElementById("print-root");
    if (!el) return null;
    return createPortal(children, el);
}
