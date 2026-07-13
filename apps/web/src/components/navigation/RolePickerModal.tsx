import {
    BookOutlined,
    CrownOutlined,
    DollarOutlined,
    SafetyOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { useActiveRole } from "@web/src/features/organization";
import { Modal, Typography, theme } from "antd";
import type React from "react";

const { Text, Title } = Typography;

const ROLE_COPY: Record<string, string> = {
    owner: "Full organization control and billing oversight.",
    admin: "Manage people, sessions, content, and operations.",
    finance: "Handle accounts, plans, and money movement.",
    teacher: "Run sessions, lessons, and classroom content.",
    student: "Access your lessons, schedule, and Entix points.",
};

export const RolePickerModal: React.FC = () => {
    const { needsRoleSelection, userRoles, setActiveRole } = useActiveRole();
    const { token } = theme.useToken();

    const getRoleIcon = (role: string) => {
        if (role === "owner") return <CrownOutlined />;
        if (role === "admin") return <SafetyOutlined />;
        if (role === "finance") return <DollarOutlined />;
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
            centered
            width={420}
            className="[&_.ant-modal-content]:rounded-xl"
        >
            <div className="px-3 pt-3 pb-2">
                <Title level={4} className="!m-0 font-display tracking-tight">
                    Choose your role
                </Title>
                <Text type="secondary" className="block mt-1 mb-4">
                    Select how you want to work in this organization.
                </Text>

                <div className="flex flex-col gap-2">
                    {userRoles.map((role) => {
                        const label = `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
                        return (
                            <button
                                key={role}
                                type="button"
                                onClick={() => setActiveRole(role)}
                                className="flex items-center gap-3 w-full text-left rounded-[10px] px-3 py-3 transition-colors cursor-pointer"
                                style={{
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    background: token.colorBgContainer,
                                    font: "inherit",
                                    color: "inherit",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = token.colorPrimaryBg;
                                    e.currentTarget.style.borderColor = token.colorPrimaryBorder;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = token.colorBgContainer;
                                    e.currentTarget.style.borderColor = token.colorBorderSecondary;
                                }}
                            >
                                <div
                                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                                    style={{
                                        background: token.colorPrimaryBg,
                                        color: token.colorPrimary,
                                        fontSize: 16,
                                    }}
                                >
                                    {getRoleIcon(role)}
                                </div>
                                <div className="min-w-0">
                                    <Text strong className="block text-[13.5px] leading-5">
                                        {label}
                                    </Text>
                                    <Text type="secondary" className="text-[12px] leading-4">
                                        {ROLE_COPY[role] || "Continue with this role."}
                                    </Text>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};
