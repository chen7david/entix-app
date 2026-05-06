import { BookOutlined, CrownOutlined, SafetyOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Modal, Typography } from "antd";
import type React from "react";
import { useActiveRole } from "@web/src/features/organization";

const { Text } = Typography;

export const RolePickerModal: React.FC = () => {
    const { needsRoleSelection, userRoles, setActiveRole } = useActiveRole();
    const getRoleIcon = (role: string) => {
        if (role === "owner") return <CrownOutlined />;
        if (role === "admin") return <SafetyOutlined />;
        if (role === "teacher") return <BookOutlined />;
        return <UserOutlined />;
    };

    return (
        <Modal
            open={needsRoleSelection}
            closable={false}
            maskClosable={false}
            keyboard={false}
            footer={null}
            title="Choose your role"
        >
            <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                Select a role for this organization session.
            </Text>
            {userRoles.map((role) => (
                <Button
                    key={role}
                    block
                    onClick={() => setActiveRole(role)}
                    style={{ marginBottom: 8 }}
                    icon={getRoleIcon(role)}
                >
                    {role.charAt(0).toUpperCase()}
                    {role.slice(1)}
                </Button>
            ))}
        </Modal>
    );
};
