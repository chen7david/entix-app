import { ArrowLeftOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { PageBreadcrumb } from "@web/src/components/layout/PageBreadcrumb";
import { PageShell } from "@web/src/components/layout/PageShell";
import { LessonStudyContent } from "@web/src/features/lessons/components/LessonStudyContent";
import { useLessonById } from "@web/src/features/lessons/hooks/useLessons";
import { useOrganization } from "@web/src/features/organization";
import { Button } from "antd";
import type React from "react";
import { useNavigate, useParams } from "react-router";

export function LessonStudyPage(): React.ReactElement | null {
    const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const navigate = useNavigate();
    const lessonQuery = useLessonById(organizationId, lessonId);
    const orgSlug = slug ?? activeOrganization?.slug;
    const orgPrefix = orgSlug ? `/org/${orgSlug}` : "";

    if (!slug || !lessonId || !organizationId) return null;

    return (
        <PageShell fill={false}>
            <PageBreadcrumb
                items={[
                    { title: "Home", path: `${orgPrefix}${AppRoutes.org.dashboard.index}` },
                    { title: "Lessons", path: `${orgPrefix}${AppRoutes.org.dashboard.lessons}` },
                    { title: lessonQuery.data?.title ?? "Lesson" },
                ]}
            />
            <div className="mb-6">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(`/org/${slug}${AppRoutes.org.dashboard.lessons}`)}
                    className="!px-0"
                >
                    My lessons
                </Button>
            </div>
            <LessonStudyContent
                organizationId={organizationId}
                lessonId={lessonId}
                slug={slug}
                playlistArea="dashboard"
            />
        </PageShell>
    );
}
