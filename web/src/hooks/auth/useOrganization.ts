import { authClient } from "@web/src/lib/auth-client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

export const useOrganization = () => {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [activeOrganization, setActiveOrganization] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const listOrganizations = async () => {
        setLoading(true);
        const { data, error } = await authClient.organization.list();
        if (data) {
            setOrganizations(data);
        }
        setLoading(false);
        return { data, error };
    };

    const createOrganization = async (name: string, slug: string) => {
        const { data, error } = await authClient.organization.create({
            name,
            slug,
        });
        if (data) {
            await listOrganizations();
            navigate(`/organization/${data.id}`);
        }
        return { data, error };
    };

    const setActive = async (organizationId: string) => {
        const { data, error } = await authClient.organization.setActive({
            organizationId,
        });
        if (data) {
            setActiveOrganization(data);
            navigate(`/organization/${organizationId}`);
        }
        return { data, error };
    };

    const getActiveOrganization = async () => {
        const { data } = await authClient.organization.getFullOrganization();
        if (data) {
            setActiveOrganization(data);
        }
    }

    useEffect(() => {
        listOrganizations();
        getActiveOrganization();
    }, []);

    return {
        organizations,
        activeOrganization,
        loading,
        listOrganizations,
        createOrganization,
        setActive,
    };
};
