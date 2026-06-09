import { ClockCircleOutlined } from "@ant-design/icons";
import { useOrganization } from "@web/src/features/organization";
import { useSessionById } from "@web/src/features/schedule";
import { Card, Result, Space, Spin, Tag, Typography } from "antd";
import type React from "react";
import { Link, useParams } from "react-router";

function sessionStatusTagColor(status: "scheduled" | "completed" | "cancelled") {
    if (status === "completed") return "green";
    if (status === "cancelled") return "default";
    return "blue";
}

export const SessionDetailPage: React.FC = () => {
    const { slug, sessionId } = useParams<{ slug: string; sessionId: string }>();
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const sessionQuery = useSessionById(organizationId, sessionId);

    const teachingSessionsHref = slug ? `/org/${slug}/teaching/sessions` : "/";

    if (!slug || !sessionId) return null;

    const sessionTitle = sessionQuery.data?.title ?? "Session";

    return (
        <div style={{ padding: 24 }}>
            <Space align="baseline" wrap size="middle" style={{ marginBottom: 12 }}>
                <Link to={teachingSessionsHref}>← Back to schedule</Link>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    {sessionTitle}
                </Typography.Title>
                {sessionQuery.data?.status != null ? (
                    <Tag color={sessionStatusTagColor(sessionQuery.data.status)}>
                        {sessionQuery.data.status}
                    </Tag>
                ) : sessionQuery.isLoading ? (
                    <Spin size="small" />
                ) : null}
            </Space>

            {sessionQuery.isLoading && !sessionQuery.data ? (
                <Typography.Text type="secondary">Loading session…</Typography.Text>
            ) : (
                <Card>
                    <Result
                        icon={<ClockCircleOutlined style={{ color: "#8b5cf6" }} />}
                        title="Session workspace"
                        subTitle={
                            <Typography.Text type="secondary">
                                Take attendance, assign vocabulary, and add lesson notes here. This
                                area is under active development.
                            </Typography.Text>
                        }
                    />
                </Card>
            )}
        </div>
    );
};
