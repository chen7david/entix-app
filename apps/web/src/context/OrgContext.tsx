import { createContext, useContext } from "react";

/** Organization row from Better Auth `organization.list()` (org guard context). */
export type ActiveOrganization = {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    logo?: string | null;
    metadata?: Record<string, unknown> | null;
};

interface OrgContextType {
    activeOrganization: ActiveOrganization | null;
    loading: boolean;
    error: Error | null;
    activeRole: string | null;
    setActiveRole: (role: string | null) => void;
}

export const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider = OrgContext.Provider;

export const useOptionalOrgContext = () => {
    return useContext(OrgContext);
};

export const useOrgContext = () => {
    const context = useOptionalOrgContext();
    if (context === undefined) {
        throw new Error("useOrgContext must be used within an OrgProvider");
    }
    return context;
};
