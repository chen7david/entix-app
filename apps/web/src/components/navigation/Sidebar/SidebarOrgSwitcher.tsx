import { CheckOutlined, DownOutlined, SettingOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useActiveRole, useOrganization } from "@web/src/features/organization";
import { Popover, Typography, theme } from "antd";
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";

const { Text } = Typography;

function formatRole(role: string) {
    return role.charAt(0).toUpperCase() + role.slice(1);
}

function OrgMark({
    name,
    size = 32,
    active = false,
}: {
    name?: string | null;
    size?: number;
    active?: boolean;
}) {
    const { token } = theme.useToken();
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: size >= 32 ? 8 : 6,
                background: active ? token.colorPrimary : token.colorFillSecondary,
                color: active ? token.colorTextLightSolid : token.colorTextSecondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: size >= 32 ? 13 : 11,
                fontWeight: 700,
                flexShrink: 0,
                letterSpacing: "-0.02em",
            }}
        >
            {name?.charAt(0)?.toUpperCase() || "?"}
        </div>
    );
}

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
    };

    const handleManageOrgs = () => {
        const slug = activeOrganization?.slug;
        if (slug) {
            setOpen(false);
            navigate(`/org/${slug}${AppRoutes.org.admin.index}`);
        }
    };

    const sectionLabelStyle: React.CSSProperties = {
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        padding: "6px 12px 4px",
        display: "block",
        color: token.colorTextTertiary,
    };

    const rowBase = (isActive: boolean): React.CSSProperties => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        cursor: "pointer",
        borderRadius: 8,
        margin: "1px 4px",
        width: "calc(100% - 8px)",
        border: "none",
        background: isActive ? token.colorPrimaryBg : "transparent",
        transition: "background 0.15s ease",
        font: "inherit",
        color: "inherit",
        textAlign: "left",
    });

    const orgList = (
        <div style={{ width: 240, maxHeight: 360, overflow: "auto" }}>
            <Text style={sectionLabelStyle}>Organizations</Text>
            {organizations.map((org) => {
                const isActive = org.id === activeOrganization?.id;
                return (
                    <button
                        key={org.id}
                        type="button"
                        onClick={() => handleSelect(org)}
                        style={rowBase(isActive)}
                        onMouseEnter={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = token.colorFillTertiary;
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isActive
                                ? token.colorPrimaryBg
                                : "transparent";
                        }}
                    >
                        <OrgMark name={org.name} size={28} active={isActive} />
                        <Text
                            style={{
                                flex: 1,
                                fontSize: 13,
                                fontWeight: isActive ? 600 : 450,
                                minWidth: 0,
                            }}
                            ellipsis
                        >
                            {org.name}
                        </Text>
                        {isActive && (
                            <CheckOutlined
                                style={{ color: token.colorPrimary, fontSize: 12, flexShrink: 0 }}
                            />
                        )}
                    </button>
                );
            })}

            {userRoles.length > 1 && (
                <>
                    <div
                        style={{
                            borderTop: `1px solid ${token.colorSplit}`,
                            margin: "6px 0 2px",
                        }}
                    />
                    <Text style={sectionLabelStyle}>Active role</Text>
                    {userRoles.map((role) => {
                        const isActiveRole = role === activeRole;
                        return (
                            <button
                                key={role}
                                type="button"
                                onClick={() => handleRoleSelect(role)}
                                style={rowBase(isActiveRole)}
                                onMouseEnter={(e) => {
                                    if (!isActiveRole) {
                                        e.currentTarget.style.background = token.colorFillTertiary;
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
                                        fontWeight: isActiveRole ? 600 : 450,
                                    }}
                                    ellipsis
                                >
                                    {formatRole(role)}
                                </Text>
                                {isActiveRole && (
                                    <CheckOutlined
                                        style={{
                                            color: token.colorPrimary,
                                            fontSize: 12,
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </>
            )}

            <div
                style={{
                    borderTop: `1px solid ${token.colorSplit}`,
                    marginTop: 6,
                    paddingTop: 4,
                }}
            >
                <button
                    type="button"
                    onClick={handleManageOrgs}
                    style={{
                        ...rowBase(false),
                        color: token.colorTextSecondary,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = token.colorFillTertiary;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                    }}
                >
                    <SettingOutlined style={{ fontSize: 13 }} />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Manage organizations
                    </Text>
                </button>
            </div>
        </div>
    );

    const roleLabel = activeRole ? formatRole(activeRole) : null;

    return (
        <Popover
            content={orgList}
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="bottomLeft"
            arrow={false}
            styles={{
                content: {
                    padding: 6,
                    borderRadius: 12,
                    boxShadow: token.boxShadowSecondary,
                },
            }}
        >
            <button
                type="button"
                aria-label="Switch organization or role"
                aria-expanded={open}
                disabled={isSwitching}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    cursor: isSwitching ? "wait" : "pointer",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: `1px solid ${open ? token.colorBorder : "transparent"}`,
                    background: open ? token.colorFillTertiary : "transparent",
                    transition: "background 0.15s ease, border-color 0.15s ease",
                    opacity: isSwitching ? 0.65 : 1,
                    textAlign: "left",
                    font: "inherit",
                    color: "inherit",
                }}
                onMouseEnter={(e) => {
                    if (!open) e.currentTarget.style.background = token.colorFillTertiary;
                }}
                onMouseLeave={(e) => {
                    if (!open) e.currentTarget.style.background = "transparent";
                }}
            >
                <OrgMark name={activeOrganization?.name} size={34} active />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                    <Text
                        strong
                        className="font-display"
                        style={{ fontSize: 13.5, lineHeight: "18px", letterSpacing: "-0.01em" }}
                        ellipsis
                    >
                        {activeOrganization?.name || "Select organization"}
                    </Text>
                    <Text
                        type="secondary"
                        style={{ fontSize: 11.5, lineHeight: "15px", marginTop: 1 }}
                        ellipsis
                    >
                        {roleLabel
                            ? `Acting as ${roleLabel}`
                            : activeOrganization?.slug || "No organization"}
                    </Text>
                </div>
                <DownOutlined
                    style={{
                        color: token.colorTextTertiary,
                        fontSize: 10,
                        flexShrink: 0,
                        transform: open ? "rotate(180deg)" : undefined,
                        transition: "transform 0.15s ease",
                    }}
                />
            </button>
        </Popover>
    );
};
