import { useOptionalOrgContext } from "@web/src/context/OrgContext";
import { useCallback } from "react";
import { type NavigateOptions, type To, useNavigate } from "react-router";

/**
 * A strongly-typed navigation hook specifically designed for Multi-Tenant Organization abstractions.
 * Automatically inspects the Active Organization state and encapsulates URL generation smoothly.
 *
 * Instead of explicitly extracting `getOrgLink(...)` natively everywhere, `useOrgNavigate` provides a
 * drop-in replacement for standard React Router abstractions natively guaranteeing the path bindings explicitly!
 */
export const useOrgNavigate = () => {
    const navigate = useNavigate();
    const orgContext = useOptionalOrgContext();
    const activeOrganization = orgContext?.activeOrganization || null;

    return useCallback(
        (to: To | number, options?: NavigateOptions) => {
            // Only map strings dynamically. If navigating via numerical history (e.g. `navigate(-1)`), process organically
            if (typeof to === "number") {
                navigate(to as any);
                return;
            }

            const pathStr = typeof to === "string" ? to : to.pathname || "";

            // If there's no active tenant globally, safely fall back without modifications
            if (!activeOrganization?.slug) {
                navigate(to, options);
                return;
            }

            // Clean parameter formatting explicitly bypassing raw mutations structurally smoothly
            const cleanPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
            const finalPath = `/org/${activeOrganization.slug}${cleanPath}`;

            navigate(typeof to === "string" ? finalPath : { ...to, pathname: finalPath }, options);
        },
        [navigate, activeOrganization?.slug]
    );
};
