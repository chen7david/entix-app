import { createContext, useContext } from "react";

interface OrgContextType {
    activeOrganization: any | null;
    loading: boolean;
    error: Error | null;
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
