import { authClient } from "@web/src/lib/auth-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateOrganization = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (values: { name: string; slug: string; logo?: string }) => {
            const response = await authClient.organization.create({
                name: values.name,
                slug: values.slug,
                logo: values.logo,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to create organization");
            }

            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listOrganizations"] });
            // Also invalidate session as active org might change or user roles might update
            // better-auth hooks usually handle their own cache but if we use useListOrganizations it might need invalidation if it uses react-query internally or we might need to refetch
        }
    });
};

export const useUpdateOrganization = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (values: { organizationId: string; name?: string; slug?: string; logo?: string }) => {
            const response = await authClient.organization.update({
                organizationId: values.organizationId,
                data: {
                    name: values.name,
                    slug: values.slug,
                    logo: values.logo,
                }
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to update organization");
            }

            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listOrganizations"] });
        }
    });
};

export const useDeleteOrganization = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (values: { organizationId: string }) => {
            const response = await authClient.organization.delete({
                organizationId: values.organizationId,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to delete organization");
            }

            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listOrganizations"] });
        }
    });
};

export const useSetActiveOrganization = () => {
    return useMutation({
        mutationFn: async (values: { organizationId: string }) => {
            const response = await authClient.organization.setActive({
                organizationId: values.organizationId,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to set active organization");
            }

            return response;
        },
    });
};

// Re-export the list hook from better-auth for consistency
export const useListOrganizations = authClient.useListOrganizations;
export const useActiveOrganization = authClient.useActiveOrganization;
