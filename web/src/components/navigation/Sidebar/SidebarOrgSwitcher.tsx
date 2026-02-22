import React, { useState } from 'react';
import { Typography, Popover } from 'antd';
import { SwapOutlined, CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

const { Text } = Typography;

export const SidebarOrgSwitcher: React.FC = () => {
    const { organizations, activeOrganization, setActive, isSwitching } = useOrganization();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleSelect = async (org: { id: string; slug: string }) => {
        if (org.id === activeOrganization?.id) {
            setOpen(false);
            return;
        }
        await setActive(org.id);
        setOpen(false);
        navigate(links.dashboard.index(org.slug));
    };

    const handleManageOrgs = () => {
        const slug = activeOrganization?.slug;
        if (slug) {
            setOpen(false);
            navigate(links.organization.index(slug));
        }
    };

    const orgList = (
        <div style={{ width: 220, maxHeight: 280, overflow: 'auto' }}>
            <div style={{ padding: '4px 0' }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, padding: '4px 12px', display: 'block' }}>
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
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderRadius: 6,
                            margin: '0 4px',
                            background: isActive ? 'rgba(100, 108, 255, 0.08)' : 'transparent',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isActive ? 'rgba(100, 108, 255, 0.08)' : 'transparent';
                        }}
                    >
                        <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: isActive ? '#646cff' : '#e8e8e8',
                            color: isActive ? '#fff' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                        }}>
                            {org.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <Text
                            style={{
                                flex: 1,
                                fontSize: 13,
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? '#646cff' : '#333',
                            }}
                            ellipsis
                        >
                            {org.name}
                        </Text>
                        {isActive && (
                            <CheckOutlined style={{ color: '#646cff', fontSize: 12 }} />
                        )}
                    </div>
                );
            })}
            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 4, paddingTop: 4 }}>
                <div
                    onClick={handleManageOrgs}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderRadius: 6,
                        margin: '0 4px',
                        color: '#666',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <PlusOutlined style={{ fontSize: 12 }} />
                    <Text style={{ fontSize: 13, color: '#666' }}>Manage Organizations</Text>
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
            overlayInnerStyle={{ padding: 4, borderRadius: 10 }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: 8,
                    transition: 'background 0.15s',
                    opacity: isSwitching ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#646cff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                }}>
                    {activeOrganization?.name?.charAt(0)?.toUpperCase() || 'E'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <Text strong style={{ fontSize: 13, lineHeight: '18px', color: '#1a1a1a' }} ellipsis>
                        Entix
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, lineHeight: '14px' }} ellipsis>
                        {activeOrganization?.slug || 'No organization'}
                    </Text>
                </div>
                <SwapOutlined style={{ color: '#999', fontSize: 12, flexShrink: 0 }} />
            </div>
        </Popover>
    );
};
