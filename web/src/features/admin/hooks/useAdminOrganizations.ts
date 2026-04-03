import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@web/src/lib/auth-client";

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
            const url = new URL("/api/v1/admin/organizations", window.location.origin);
            if (search) url.searchParams.set("search", search);
            if (options?.cursor) url.searchParams.set("cursor", options.cursor);
            if (options?.limit) url.searchParams.set("limit", options.limit.toString());
            if (options?.direction) url.searchParams.set("direction", options.direction);

            const response = await fetch(url.toString());
            if (!response.ok) {
                const error = await response
                    .json()
                    .catch(() => ({ message: "Failed to fetch global organizations" }));
                throw new Error(error.message || "Failed to fetch global organizations");
            }
            return response.json() as Promise<{
                items: any[];
                nextCursor: string | null;
                prevCursor: string | null;
            }>;
        },
        placeholderData: keepPreviousData,
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
            const response = await fetch("/api/v1/auth/signup-with-org", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to create user and organization");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        },
    });
};
