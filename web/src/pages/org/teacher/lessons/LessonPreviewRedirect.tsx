import type React from "react";
import { Navigate, useParams } from "react-router";

/** Legacy `/teaching/lessons/:id/preview` URLs → lesson detail (preview is the default view). */
export function LessonPreviewRedirect(): React.ReactElement | null {
    const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
    if (!slug || !lessonId) return null;
    return <Navigate to={`/org/${slug}/teaching/lessons/${lessonId}`} replace />;
}
