import { authClient } from "@web/src/lib/auth-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
// Re-export the list hook from better-auth for consistency
export const useListOrganizations = authClient.useListOrganizations;
export const useActiveOrganization = authClient.useActiveOrganization;
export const useListInvitations = () => {
    return useQuery({
        queryKey: ["listInvitations"],
        queryFn: async () => {
            const response = await authClient.organization.listInvitations();
            if (response.error) {
                throw new Error(response.error.message || "Failed to list invitations");
            }
            return response.data;
        }
    });
};

export const useInviteMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (values: { email: string; role: "admin" | "member" | "owner" }) => {
            const response = await authClient.organization.inviteMember({
                email: values.email,
                role: values.role,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to invite member");
            }

            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listInvitations"] });
        }
    });
};

export const useCancelInvitation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (values: { invitationId: string }) => {
            const response = await authClient.organization.cancelInvitation({
                invitationId: values.invitationId,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to cancel invitation");
            }

            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listInvitations"] });
        }
    });
};

export const useAcceptInvitation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (values: { invitationId: string }) => {
            try {
                const response = await authClient.organization.acceptInvitation({
                    invitationId: values.invitationId,
                });

                if (response.error) {
                    throw new Error(response.error.message || "Failed to accept invitation");
                }

                return response;
            } catch (error) {
                console.error(error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listOrganizations"] });
            queryClient.invalidateQueries({ queryKey: ["activeOrganization"] });
        },
        onError: (err: any) => {
            console.error("Accept invitation failed:", {
                code: err.code,
                message: err.message,
                details: err.details,
                cause: err.cause,
            });
            console.error(JSON.stringify(err));
        }
    });
};
