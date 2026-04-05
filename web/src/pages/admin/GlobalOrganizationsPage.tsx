import {
    ApartmentOutlined,
    CalendarOutlined,
    MoreOutlined,
    PlusOutlined,
    UserAddOutlined,
} from "@ant-design/icons";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useAdminCreateUserWithOrg, useAdminOrganizations } from "@web/src/features/admin";
import { SignUpWithOrgForm, type SignUpWithOrgValues } from "@web/src/features/auth";
import { CreateOrganizationForm } from "@web/src/features/organization";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import type { MenuProps } from "antd";
import { App, Button, Card, Col, Dropdown, Modal, Row, Statistic, Tag, Typography } from "antd";
import dayjs from "dayjs";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

export const GlobalOrganizationsPage: React.FC = () => {
    const { message } = App.useApp();
    const [searchText, setSearchText] = useState("");
    const [currentCursor, setCurrentCursor] = useState<string | undefined>();
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [limit, setLimit] = useState(10);

    const [debouncedSearch] = useDebouncedValue(searchText, {
        wait: UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE,
    });

    const {
        data: orgData,
        isLoading,
        refetch,
    } = useAdminOrganizations(debouncedSearch || undefined, {
        cursor: currentCursor,
        limit,
    });

    const { mutate: createUserWithOrg, isPending: isCreatingUserWithOrg } =
        useAdminCreateUserWithOrg();

    const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
    const [isCreateUserWithOrgModalOpen, setIsCreateUserWithOrgModalOpen] = useState(false);

    const handleNext = () => {
        if (orgData?.nextCursor) {
            setCursorStack((prev) => [...prev, currentCursor || ""]);
            setCurrentCursor(orgData.nextCursor);
        }
    };

    const handlePrev = () => {
        const prevStack = [...cursorStack];
        const prevCursor = prevStack.pop();
        setCursorStack(prevStack);
        setCurrentCursor(prevCursor);
    };

    const handleCreateUserWithOrg = (values: SignUpWithOrgValues) => {
        createUserWithOrg(values, {
            onSuccess: () => {
                message.success(
                    `Organization "${values.organizationName}" and user created successfully`
                );
                setIsCreateUserWithOrgModalOpen(false);
                refetch();
            },
            onError: (error: Error) => {
                message.error(error.message || "Failed to create user and organization");
            },
        });
    };

    const columns = [
        {
            title: "Organization",
            key: "name",
            width: 250,
            render: (_: any, record: any) => (
                <div className="flex items-center gap-3">
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: "var(--ant-color-primary)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 15,
                            fontWeight: 700,
                            flexShrink: 0,
                        }}
                    >
                        {record.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                        <div className="font-medium">{record.name}</div>
                        <div className="text-xs text-gray-500">{record.slug}</div>
                    </div>
                </div>
            ),
        },
        {
            title: "Slug",
            dataIndex: "slug",
            key: "slug",
            width: 150,
            render: (slug: string) => <Tag>{slug}</Tag>,
            responsive: ["md" as const],
        },
        {
            title: "Created",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 150,
            render: (date: number) => (
                <span className="flex items-center gap-1 text-gray-500 text-sm">
                    <CalendarOutlined />
                    {dayjs(date).format("MMM D, YYYY")}
                </span>
            ),
            responsive: ["lg" as const],
        },
    ];

    return (
        <>
            <Toolbar />
            <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>
                            Global Organizations
                        </Title>
                        <Text type="secondary">
                            Manage all platform organizations and their owners
                        </Text>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateOrgModalOpen(true)}
                        >
                            Create Organization
                        </Button>
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={() => setIsCreateUserWithOrgModalOpen(true)}
                        >
                            Create User + Org
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <Row gutter={16} className="mb-8">
                    <Col xs={24} sm={8}>
                        <Card
                            loading={isLoading}
                            className="border-gray-200 shadow-sm border-none bg-white/50 backdrop-blur-sm"
                        >
                            <Statistic
                                title="Platform Organizations"
                                value={orgData?.items?.length || 0}
                                prefix={<ApartmentOutlined className="text-blue-500" />}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Table */}
                <div className="h-[calc(100vh-420px)] min-h-[500px]">
                    <DataTableWithFilters
                        config={{
                            columns,
                            data: orgData?.items || [],
                            loading: isLoading,
                            filters: [
                                {
                                    type: "search",
                                    key: "search",
                                    placeholder: "Search organizations...",
                                },
                            ],
                            onFiltersChange: (f: Record<string, any>) => {
                                setSearchText(f.search || "");
                                setCurrentCursor(undefined);
                                setCursorStack([]);
                            },
                            pagination: {
                                pageSize: limit,
                                hasNextPage: !!orgData?.nextCursor,
                                hasPrevPage: cursorStack.length > 0,
                                onNext: handleNext,
                                onPrev: handlePrev,
                                onPageSizeChange: (s) => {
                                    setLimit(s);
                                    setCurrentCursor(undefined);
                                    setCursorStack([]);
                                },
                            },
                            actions: () => {
                                const items: MenuProps["items"] = [
                                    { key: "view", label: "View Details" },
                                ];
                                return (
                                    <Dropdown menu={{ items }} trigger={["click"]}>
                                        <Button type="text" icon={<MoreOutlined />} />
                                    </Dropdown>
                                );
                            },
                        }}
                    />
                </div>
            </div>

            {/* Create Organization Modal */}
            <Modal
                title="Create Organization"
                open={isCreateOrgModalOpen}
                onCancel={() => setIsCreateOrgModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <CreateOrganizationForm
                    onSuccess={() => {
                        setIsCreateOrgModalOpen(false);
                        refetch();
                    }}
                />
            </Modal>

            {/* Create User + Organization Modal */}
            <Modal
                title="Create User & Organization"
                open={isCreateUserWithOrgModalOpen}
                onCancel={() => setIsCreateUserWithOrgModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <div className="mb-4">
                    <Text type="secondary">
                        Creates a new user account and a new organization. The user becomes the
                        owner of the organization and receives a password reset email.
                    </Text>
                </div>
                <SignUpWithOrgForm
                    onSubmit={handleCreateUserWithOrg}
                    isLoading={isCreatingUserWithOrg}
                />
            </Modal>
        </>
    );
};
