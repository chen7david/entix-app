

export const getOrgLink = (path: string, orgId?: string) => {
    // If orgId is provided, use it
    if (orgId) {
        return `/organization/${orgId}${path.startsWith('/') ? path : `/${path}`}`;
    }

    // Try to get active organization from auth client state if possible, 
    // but since this is a synchronous helper and auth state might be async or in hook,
    // we rely on the caller to pass it or we try to parse it from current URL if we are in a browser context.

    // Fallback: try to get from URL
    if (typeof window !== 'undefined') {
        const match = window.location.pathname.match(/\/organization\/([^\/]+)/);
        if (match && match[1]) {
            return `/organization/${match[1]}${path.startsWith('/') ? path : `/${path}`}`;
        }
    }

    // If no org context found, return path as is (or handle error)
    // For now, we return it under a placeholder or root if appropriate, 
    // but for org-scoped links, this might be invalid. 
    // We'll return it as is, assuming the router might handle it or it's a relative path.
    return path;
};
