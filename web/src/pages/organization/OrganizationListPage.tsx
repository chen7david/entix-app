import {
    AppstoreOutlined,
    EyeOutlined,
    MailOutlined,
    MoreOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { EntityAvatar } from "@web/src/components/ui/EntityAvatar";
import { useInvitations, useMembers, useOrganization } from "@web/src/features/organization";
import type { MenuProps } from "antd";
import {
    Button,
    Card,
    Col,
    Dropdown,
    Row,
    Skeleton,
    Statistic,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";

const { Title, Text } = Typography;

export const OrganizationListPage = () => {
    const { organizations, loading, activeOrganization } = useOrganization();
    const { members } = useMembers();
    const { invitations } = useInvitations();
    const [search, setSearch] = useState("");

    // Sort: active org on top
    const sortedOrgs = [...(organizations || [])].sort((a, b) => {
        if (a.id === activeOrganization?.id) return -1;
        if (b.id === activeOrganization?.id) return 1;
        return 0;
    });

    const filteredOrgs = sortedOrgs.filter((org) => {
        if (!search) return true;
        const lowerSearch = search.toLowerCase();
        return (
            org.name.toLowerCase().includes(lowerSearch) ||
            org.slug.toLowerCase().includes(lowerSearch)
        );
    });

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
                                    color="purple"
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

    if (loading) {
        return (
            <>
                <Toolbar />
                <div className="p-6">
                    <Skeleton active />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar />
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>
                            Manage Organizations
                        </Title>
                        <Text type="secondary">View and manage your organizations</Text>
                    </div>
                </div>

                {/* Stats Cards */}
                <Row gutter={16} className="mb-8">
                    <Col xs={24} sm={8}>
                        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                            <Statistic
                                title="Current Organization"
                                value={activeOrganization?.name || "None"}
                                prefix={<AppstoreOutlined className="text-blue-500" />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                            <Statistic
                                title="Members"
                                value={members?.length || 0}
                                prefix={<TeamOutlined className="text-purple-500" />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                            <Statistic
                                title="Pending Invitations"
                                value={invitations?.length || 0}
                                prefix={<MailOutlined className="text-orange-500" />}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Organizations Table */}
                <div className="h-[calc(100vh-420px)] min-h-[500px]">
                    <DataTableWithFilters
                        config={{
                            columns,
                            data: filteredOrgs,
                            rowKey: "id",
                            filters: [
                                {
                                    type: "search",
                                    key: "search",
                                    placeholder: "Search organizations...",
                                },
                            ],
                            onFiltersChange: (f: Record<string, any>) => setSearch(f.search || ""),
                            pagination: {
                                pageSize: 12,
                            },
                        }}
                    />
                </div>
            </div>
        </>
    );
};
