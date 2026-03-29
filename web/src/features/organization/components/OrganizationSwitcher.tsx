import { AppRoutes } from "@shared";
import { useOrganization } from "@web/src/features/organization";
import { App, Select } from "antd";
import { useNavigate } from "react-router";

export const OrganizationSwitcher = ({ afterSelect }: { afterSelect?: () => void }) => {
    const { organizations, activeOrganization, setActive, isSwitching } = useOrganization();
    const navigate = useNavigate();

    const { message } = App.useApp();

    const handleChange = async (value: string) => {
        const { error } = await setActive(value);
        if (error) {
            message.error("Failed to switch organization");
        } else {
            message.success("Switched organization successfully");
            if (afterSelect) {
                afterSelect();
            } else {
                // Default: navigate to the selected org's dashboard
                const selectedOrg = organizations.find((o: any) => o.id === value);
                if (selectedOrg?.slug) {
                    navigate(`/org/${selectedOrg.slug}${AppRoutes.org.dashboard.index}`);
                }
            }
        }
    };

    const options = [
        ...(organizations?.map((org: any) => ({
            label: org.name,
            value: org.id,
        })) || []),
    ];

    return (
        <Select
            style={{ width: 200 }}
            placeholder="Select Organization"
            value={activeOrganization?.id}
            onChange={handleChange}
            loading={isSwitching}
            options={options}
        />
    );
};
