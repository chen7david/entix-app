import { ArrowLeftOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { useOrganization } from "@web/src/features/organization";
import { useSessionById } from "@web/src/features/schedule";
import { Button, Card, Result, Spin, Tag, Typography, theme } from "antd";
import type React from "react";
import { useNavigate, useParams } from "react-router";

function sessionStatusTagColor(status: "scheduled" | "completed" | "cancelled") {
    if (status === "completed") return "green";
    if (status === "cancelled") return "default";
    return "blue";
}

export const SessionDetailPage: React.FC = () => {
    const { token } = theme.useToken();
    const navigate = useNavigate();
    const { slug, sessionId } = useParams<{ slug: string; sessionId: string }>();
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const sessionQuery = useSessionById(organizationId, sessionId);

    const teachingSessionsHref = slug ? `/org/${slug}/teaching/sessions` : "/";

    if (!slug || !sessionId) return null;

    const sessionTitle = sessionQuery.data?.title ?? "Session";

    return (
        <PageShell fill={false}>
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(teachingSessionsHref)}
                className="self-start !px-0 !mb-2"
                style={{ color: token.colorTextSecondary }}
            >
                Back to schedule
            </Button>
            <PageHeader
                title={sessionTitle}
                subtitle="Session workspace"
                actions={
                    sessionQuery.data?.status != null ? (
                        <Tag color={sessionStatusTagColor(sessionQuery.data.status)}>
                            {sessionQuery.data.status}
                        </Tag>
                    ) : sessionQuery.isLoading ? (
                        <Spin size="small" />
                    ) : undefined
                }
            />

            {sessionQuery.isLoading && !sessionQuery.data ? (
                <Typography.Text type="secondary">Loading session…</Typography.Text>
            ) : (
                <Card>
                    <Result
                        icon={<ClockCircleOutlined style={{ color: token.colorPrimary }} />}
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
        </PageShell>
    );
};
