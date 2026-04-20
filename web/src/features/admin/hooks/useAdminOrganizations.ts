import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { authClient } from "@web/src/lib/auth-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";

export const useAdminOrganizations = (
    search?: string,
    options?: { cursor?: string; limit?: number; direction?: "next" | "prev" }
) => {
    return useQuery({
        queryKey: [
            "admin",
            "organizations",
            search,
            options?.cursor,
            options?.limit,
            options?.direction,
        ],
        queryFn: async () => {
            const api = getApiClient();
            const res = await api.api.v1.admin.organizations.$get({
                query: {
                    search,
                    cursor: options?.cursor,
                    limit: options?.limit,
                    direction: options?.direction,
                },
            });
            return hcJson<{
                items: any[];
                nextCursor: string | null;
                prevCursor: string | null;
            }>(res);
        },
        placeholderData: keepPreviousData,
        staleTime: QUERY_STALE_MS,
    });
};

export const useAdminCreateOrganization = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
            const res = await authClient.organization.create({ name, slug });
            if (res.error) throw new Error(res.error.message);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        },
    });
};

export const useAdminCreateUserWithOrg = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (values: {
            email: string;
            password: string;
            name: string;
            organizationName: string;
        }) => {
            const api = getApiClient();
            const res = await api.api.v1.auth["signup-with-org"].$post({
                json: values,
            });
            return hcJson(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        },
    });
};
