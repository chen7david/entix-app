import { createContext, useContext } from 'react';
// import type { Organization } from 'better-auth/types'; 

interface OrgContextType {
    activeOrganization: any | null;
    loading: boolean;
    error: Error | null;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider = OrgContext.Provider;

export const useOrgContext = () => {
    const context = useContext(OrgContext);
    if (context === undefined) {
        throw new Error('useOrgContext must be used within an OrgProvider');
    }
    return context;
};
