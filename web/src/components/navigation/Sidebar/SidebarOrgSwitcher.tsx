import { CheckOutlined, PlusOutlined, SwapOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useActiveRole, useOrganization } from "@web/src/features/organization";
import { Popover, Typography, theme } from "antd";
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";

const { Text } = Typography;

export const SidebarOrgSwitcher: React.FC = () => {
    const { organizations, activeOrganization, setActive, isSwitching } = useOrganization();
    const { activeRole, setActiveRole, userRoles } = useActiveRole();
    const { token } = theme.useToken();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleSelect = async (org: { id: string; slug: string }) => {
        if (org.id === activeOrganization?.id) {
            setOpen(false);
            return;
        }
        await setActive(org.id);
        setOpen(false);
        navigate(`/org/${org.slug}${AppRoutes.org.dashboard.index}`);
    };

    const handleRoleSelect = (role: string) => {
        if (!activeOrganization?.slug) return;
        if (role === activeRole) {
            setOpen(false);
            return;
        }
        setActiveRole(role);
        setOpen(false);
        navigate(`/org/${activeOrganization.slug}${AppRoutes.org.dashboard.index}`);
    };

    const handleManageOrgs = () => {
        const slug = activeOrganization?.slug;
        if (slug) {
            setOpen(false);
            navigate(`/org/${slug}${AppRoutes.org.admin.index}`);
        }
    };

    const orgList = (
        <div style={{ width: 220, maxHeight: 280, overflow: "auto" }}>
            <div style={{ padding: "4px 0" }}>
                <Text
                    type="secondary"
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        padding: "4px 12px",
                        display: "block",
                    }}
                >
                    Organizations
                </Text>
            </div>
            {organizations.map((org) => {
                const isActive = org.id === activeOrganization?.id;
                return (
                    <div
                        key={org.id}
                        onClick={() => handleSelect(org)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderRadius: 6,
                            margin: "0 4px",
                            background: isActive ? "rgba(100, 108, 255, 0.08)" : "transparent",
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isActive
                                ? "rgba(100, 108, 255, 0.08)"
                                : "transparent";
                        }}
                    >
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: isActive ? "#646cff" : "#e8e8e8",
                                color: isActive ? "#fff" : "#666",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                flexShrink: 0,
                            }}
                        >
                            {org.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <Text
                            style={{
                                flex: 1,
                                fontSize: 13,
                                fontWeight: isActive ? 600 : 400,
                            }}
                            type={isActive ? undefined : "secondary"}
                            ellipsis
                        >
                            {org.name}
                        </Text>
                        {isActive && <CheckOutlined style={{ color: "#646cff", fontSize: 12 }} />}
                    </div>
                );
            })}
            {userRoles.length > 1 && (
                <>
                    <div
                        style={{
                            borderTop: `1px solid ${token.colorSplit}`,
                            marginTop: 4,
                            paddingTop: 4,
                        }}
                    >
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                padding: "4px 12px",
                                display: "block",
                            }}
                        >
                            Active Role
                        </Text>
                    </div>
                    {userRoles.map((role) => {
                        const isActiveRole = role === activeRole;
                        return (
                            <div
                                key={role}
                                onClick={() => handleRoleSelect(role)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderRadius: 6,
                                    margin: "0 4px",
                                    background: isActiveRole ? token.colorPrimaryBg : "transparent",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActiveRole) {
                                        e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = isActiveRole
                                        ? token.colorPrimaryBg
                                        : "transparent";
                                }}
                            >
                                <Text
                                    style={{
                                        flex: 1,
                                        fontSize: 13,
                                        fontWeight: isActiveRole ? 600 : 400,
                                    }}
                                    type={isActiveRole ? undefined : "secondary"}
                                    ellipsis
                                >
                                    {role.charAt(0).toUpperCase()}
                                    {role.slice(1)}
                                </Text>
                                {isActiveRole && (
                                    <CheckOutlined
                                        style={{ color: token.colorPrimary, fontSize: 12 }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </>
            )}
            <div
                style={{ borderTop: `1px solid ${token.colorSplit}`, marginTop: 4, paddingTop: 4 }}
            >
                <div
                    onClick={handleManageOrgs}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        cursor: "pointer",
                        borderRadius: 6,
                        margin: "0 4px",
                        color: "#666",
                        transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                    }}
                >
                    <PlusOutlined style={{ fontSize: 12 }} />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Manage Organizations
                    </Text>
                </div>
            </div>
        </div>
    );

    return (
        <Popover
            content={orgList}
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="topLeft"
            arrow={false}
            styles={{ content: { padding: 4, borderRadius: 10 } }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    padding: "6px 8px",
                    borderRadius: 8,
                    transition: "background 0.15s",
                    opacity: isSwitching ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                }}
            >
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#646cff",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                    }}
                >
                    {activeOrganization?.name?.charAt(0)?.toUpperCase() || "E"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                    <Text strong style={{ fontSize: 13, lineHeight: "18px" }} ellipsis>
                        Entix
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, lineHeight: "14px" }} ellipsis>
                        {activeOrganization?.slug || "No organization"}
                        {activeRole
                            ? ` · ${activeRole.charAt(0).toUpperCase()}${activeRole.slice(1)}`
                            : ""}
                    </Text>
                </div>
                <SwapOutlined style={{ color: "#999", fontSize: 12, flexShrink: 0 }} />
            </div>
        </Popover>
    );
};
