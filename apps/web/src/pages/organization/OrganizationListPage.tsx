import {
    AppstoreOutlined,
    EyeOutlined,
    MailOutlined,
    MoreOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { EntityAvatar } from "@web/src/components/ui/EntityAvatar";
import { useInvitations, useMembers, useOrganization } from "@web/src/features/organization";
import type { MenuProps } from "antd";
import { Button, Card, Col, Dropdown, Row, Skeleton, Statistic, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";

export const OrganizationListPage = () => {
    const { organizations, orgsLoaded, activeOrganization } = useOrganization();
    const { members } = useMembers();
    const { invitations } = useInvitations();
    // Organization sorting: Active org on top.
    const sortedOrgs = useMemo(() => {
        if (!organizations) return [];
        return [...organizations].sort((a, b) => {
            if (a.id === activeOrganization?.id) return -1;
            if (b.id === activeOrganization?.id) return 1;
            return 0;
        });
    }, [organizations, activeOrganization?.id]);

    const columns = [
        {
            title: "Organization",
            key: "name",
            render: (_: any, record: any) => (
                <div className="flex items-center gap-3">
                    <EntityAvatar
                        active={record.id === activeOrganization?.id}
                        text={record.name}
                    />
                    <div className="flex flex-col flex-1 min-w-0 max-w-[300px]">
                        <div className="font-medium flex items-center gap-2">
                            <Tooltip title={record.name} placement="topLeft" mouseEnterDelay={0.5}>
                                <span className="truncate block max-w-[200px]">{record.name}</span>
                            </Tooltip>
                            {record.id === activeOrganization?.id && (
                                <Tag
                                    color="blue"
                                    style={{ fontSize: 11 }}
                                    className="flex-shrink-0"
                                >
                                    Active
                                </Tag>
                            )}
                        </div>
                        <Tooltip title={record.slug} placement="topLeft" mouseEnterDelay={0.5}>
                            <div className="text-xs text-gray-500 truncate block">
                                {record.slug}
                            </div>
                        </Tooltip>
                    </div>
                </div>
            ),
        },
        {
            title: "Slug",
            dataIndex: "slug",
            key: "slug",
            responsive: ["md" as const],
        },
        {
            title: "Created",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date: string) => dayjs(date).format("MMM D, YYYY"),
            responsive: ["lg" as const],
        },
        {
            title: "Actions",
            key: "actions",
            render: () => {
                const items: MenuProps["items"] = [
                    {
                        key: "view",
                        label: "View Details",
                        icon: <EyeOutlined />,
                    },
                ];
                return (
                    <Dropdown menu={{ items }} trigger={["click"]}>
                        <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                );
            },
        },
    ];

    if (!orgsLoaded) {
        return (
            <div>
                <Skeleton active />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <PageHeader title="Organizations" subtitle="View and manage your organizations." />

            {/* Stats Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Current Organization"
                            value={activeOrganization?.name || "None"}
                            prefix={<AppstoreOutlined style={{ color: "#2563eb" }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Members"
                            value={members?.length || 0}
                            prefix={<TeamOutlined style={{ color: "#2563eb" }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Pending Invitations"
                            value={invitations?.length || 0}
                            prefix={<MailOutlined style={{ color: "#f59e0b" }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Organizations Table */}
            <div className="flex-1 min-h-0">
                <DataTableWithFilters
                    config={{
                        columns,
                        data: sortedOrgs,
                        rowKey: "id",
                        filters: [
                            {
                                type: "search",
                                key: "search",
                                placeholder: "Search organizations...",
                            },
                        ],
                        onFiltersChange: (_f: Record<string, any>) => {
                            // TODO: Implement server-side search via useOrganization hook
                        },
                        pagination: null, // TODO: Implement cursor pagination once API supports it.
                    }}
                />
            </div>
        </div>
    );
};
