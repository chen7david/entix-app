import { LessonStudyContent } from "@web/src/features/lessons/components/LessonStudyContent";
import { useOrganization } from "@web/src/features/organization";
import type React from "react";
import { Link, useParams } from "react-router";

export function LessonStudyPage(): React.ReactElement | null {
    const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;

    if (!slug || !lessonId || !organizationId) return null;

    return (
        <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
            <div className="mb-4">
                <Link to={`/org/${slug}/dashboard/lessons`} className="text-slate-500 hover:text-indigo-600 text-sm">
                    ← My lessons
                </Link>
            </div>
            <LessonStudyContent
                organizationId={organizationId}
                lessonId={lessonId}
                slug={slug}
                playlistArea="dashboard"
            />
        </div>
    );
}
