import type { ReactNode } from "react";

type PageShellProps = {
    children: ReactNode;
    /** Use full viewport table layout (flex column, fill height). Default true. */
    fill?: boolean;
    className?: string;
};

/**
 * Canonical page wrapper inside Org/Platform layouts.
 * Layout already provides p-4 md:p-8 and max-w-7xl — do not add page-level padding here.
 */
export function PageShell({ children, fill = true, className = "" }: PageShellProps) {
    return (
        <div className={`${fill ? "flex flex-col h-full min-h-0" : ""} ${className}`.trim()}>
            {children}
        </div>
    );
}
