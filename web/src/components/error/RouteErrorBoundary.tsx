import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useLocation } from "react-router";
import { SectionErrorFallback } from "./SectionErrorFallback";

function logRouteError(error: unknown, info: { componentStack?: string | null }) {
    console.error("Route error boundary:", error, info);
}

type RouteErrorBoundaryProps = {
    children: ReactNode;
};

/**
 * Layout- or route-level boundary (Phase **J** / UI.md §32): isolates render errors so shell UI stays usable.
 * Resets when the location pathname changes (e.g. user navigates to another page).
 */
export function RouteErrorBoundary({ children }: RouteErrorBoundaryProps) {
    const { pathname } = useLocation();

    return (
        <ErrorBoundary
            FallbackComponent={SectionErrorFallback}
            onError={logRouteError}
            resetKeys={[pathname]}
        >
            {children}
        </ErrorBoundary>
    );
}
