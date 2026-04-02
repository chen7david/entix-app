import {
    ArrowRightOutlined,
    SearchOutlined,
    UserOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useMembers } from "@web/src/features/organization/hooks/useMembers";
import { useOrganization } from "@web/src/features/organization/hooks/useOrganization";
import {
    Avatar,
    Button,
    Card,
    Col,
    Divider,
    Input,
    List,
    Row,
    Skeleton,
    Space,
    Tag,
    Typography,
    theme,
} from "antd";
import type React from "react";
import { useState } from "react";
import { useAuth } from "../../../features/auth";
import { MemberAccountAdminPanel } from "../../../features/finance/components/MemberAccountAdminPanel";

const { Title, Text } = Typography;

export const FinancePaymentsPage: React.FC = () => {
    const { token } = theme.useToken();
    const { activeOrganization } = useOrganization();
    const { user: currentUser } = useAuth();
    const [search, setSearch] = useState("");
    const [selectedMember, setSelectedMember] = useState<any | null>(null);

    const { members, loadingMembers, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useMembers(search);

    const effectiveOrgId = activeOrganization?.id || selectedMember?.organizationId;

    return (
        <>
            <Toolbar />
            <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 32 }}>
                    <Title level={2} style={{ margin: "0 0 4px 0" }}>
                        Member Payments & Funding
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Direct administrative ledger management. Issue credits, debits, and
                        adjustments to individual member wallets.
                    </Text>
                </div>

                <Row gutter={24}>
                    {/* Left Panel: Member Selection */}
                    <Col xs={24} lg={8} xl={7}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <div>
                                <Text
                                    strong
                                    style={{
                                        display: "block",
                                        marginBottom: 12,
                                        fontSize: 12,
                                        color: token.colorTextSecondary,
                                    }}
                                >
                                    SEARCH DIRECTORY
                                </Text>
                                <Input
                                    prefix={
                                        <SearchOutlined
                                            style={{ color: token.colorTextQuaternary }}
                                        />
                                    }
                                    placeholder="Name, email or ID..."
                                    size="large"
                                    allowClear
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <Card
                                styles={{ body: { padding: 0 } }}
                                style={{
                                    height: "calc(100vh - 350px)",
                                    overflowY: "auto",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                }}
                            >
                                {loadingMembers && members.length === 0 ? (
                                    <div style={{ padding: 24 }}>
                                        <Skeleton active avatar paragraph={{ rows: 8 }} />
                                    </div>
                                ) : (
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={members}
                                        renderItem={(member: any) => {
                                            const isSelected = selectedMember?.id === member.id;
                                            return (
                                                <List.Item
                                                    style={{
                                                        padding: "16px",
                                                        cursor: "pointer",
                                                        background: isSelected
                                                            ? "var(--ant-color-primary-bg)"
                                                            : undefined,
                                                        borderLeft: isSelected
                                                            ? `4px solid ${token.colorPrimary}`
                                                            : "4px solid transparent",
                                                        transition:
                                                            "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                                    }}
                                                    onClick={() => setSelectedMember(member)}
                                                >
                                                    <List.Item.Meta
                                                        avatar={
                                                            <Avatar
                                                                src={member.image}
                                                                icon={<UserOutlined />}
                                                            />
                                                        }
                                                        title={
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                }}
                                                            >
                                                                <Text
                                                                    strong
                                                                    style={{ fontSize: 13 }}
                                                                >
                                                                    {member.name}
                                                                </Text>
                                                                <ArrowRightOutlined
                                                                    style={{
                                                                        fontSize: 10,
                                                                        color: token.colorPrimary,
                                                                        opacity: isSelected ? 1 : 0,
                                                                    }}
                                                                />
                                                            </div>
                                                        }
                                                        description={
                                                            <Text
                                                                type="secondary"
                                                                style={{
                                                                    fontSize: 10,
                                                                    textTransform: "uppercase",
                                                                    letterSpacing: "0.02em",
                                                                }}
                                                            >
                                                                {member.email}
                                                            </Text>
                                                        }
                                                    />
                                                </List.Item>
                                            );
                                        }}
                                        loadMore={
                                            hasNextPage ? (
                                                <div style={{ padding: 16, textAlign: "center" }}>
                                                    <Button
                                                        size="small"
                                                        onClick={() => fetchNextPage()}
                                                        loading={isFetchingNextPage}
                                                        type="text"
                                                    >
                                                        Load more members
                                                    </Button>
                                                </div>
                                            ) : null
                                        }
                                        locale={{
                                            emptyText: (
                                                <div
                                                    style={{
                                                        padding: "64px 0",
                                                        textAlign: "center",
                                                        opacity: 0.5,
                                                    }}
                                                >
                                                    <UserOutlined
                                                        style={{
                                                            fontSize: 32,
                                                            marginBottom: 12,
                                                            display: "block",
                                                        }}
                                                    />
                                                    No members found
                                                </div>
                                            ),
                                        }}
                                    />
                                )}
                            </Card>
                        </div>
                    </Col>

                    {/* Right Panel: Management Dashboard */}
                    <Col xs={24} lg={16} xl={17}>
                        {selectedMember && effectiveOrgId ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                <Card
                                    variant="borderless"
                                    style={{ background: "var(--ant-color-fill-quaternary)" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                        <Avatar
                                            size={72}
                                            src={selectedMember.image}
                                            icon={<UserOutlined />}
                                            style={{
                                                border: `3px solid white`,
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                            }}
                                        />
                                        <div>
                                            <Title level={3} style={{ margin: "0 0 4px 0" }}>
                                                {selectedMember.name}
                                            </Title>
                                            <Space split={<Divider type="vertical" />}>
                                                <Text
                                                    type="secondary"
                                                    style={{
                                                        fontSize: 13,
                                                        fontFamily: "monospace",
                                                    }}
                                                >
                                                    {selectedMember.id}
                                                </Text>
                                                <Tag
                                                    color="blue"
                                                    bordered={false}
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    STATUS: ACTIVE
                                                </Tag>
                                            </Space>
                                        </div>
                                    </div>
                                </Card>

                                <MemberAccountAdminPanel
                                    memberId={selectedMember.id}
                                    orgId={effectiveOrgId}
                                    memberName={currentUser?.name || "System Admin"}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    height: "calc(100vh - 216px)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "var(--ant-color-fill-quaternary)",
                                    borderRadius: 16,
                                    border: "1px dashed var(--ant-color-border)",
                                }}
                            >
                                <WalletOutlined
                                    style={{
                                        fontSize: 80,
                                        color: "var(--ant-color-text-quaternary)",
                                        marginBottom: 20,
                                        opacity: 0.5,
                                    }}
                                />
                                <Title
                                    level={4}
                                    style={{ margin: 0, color: token.colorTextSecondary }}
                                >
                                    Awaiting Stewardship
                                </Title>
                                <Text
                                    type="secondary"
                                    style={{
                                        maxWidth: 350,
                                        textAlign: "center",
                                        marginTop: 12,
                                        fontSize: 14,
                                    }}
                                >
                                    Select a member from the directory to evaluate their ledger
                                    state and perform administrative funding operations.
                                </Text>
                            </div>
                        )}
                    </Col>
                </Row>
            </div>
        </>
    );
};
