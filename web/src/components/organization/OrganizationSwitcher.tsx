import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Select, message } from "antd";
import { useNavigate } from "react-router";

export const OrganizationSwitcher = () => {
    const { organizations, activeOrganization, setActive, isSwitching } = useOrganization();
    const navigate = useNavigate();

    const handleChange = async (value: string) => {
        if (value === 'create_new') {
            navigate('/organization'); // Navigate to list to create new
            return;
        }

        const { error } = await setActive(value);
        if (error) {
            message.error("Failed to switch organization");
        } else {
            message.success("Switched organization successfully");
        }
    };

    return (
        <Select
            style={{ width: 200 }}
            placeholder="Select Organization"
            value={activeOrganization?.id}
            onChange={handleChange}
            loading={isSwitching}
            options={[
                ...(organizations?.map(org => ({
                    label: org.name,
                    value: org.id,
                })) || []),
                {
                    label: "+ Create New Organization",
                    value: "create_new",
                }
            ]}
        />
    );
};
