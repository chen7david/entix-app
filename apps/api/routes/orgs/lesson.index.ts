import { createRouter } from "@api/lib/app.lib";
import { LessonHandlers } from "./lesson.handlers";
import { LessonRoutes } from "./lesson.routes";

export const lessonRoutes = createRouter()
    .openapi(LessonRoutes.listLessons, LessonHandlers.listLessons)
    .openapi(LessonRoutes.createLesson, LessonHandlers.createLesson)
    .openapi(LessonRoutes.getLesson, LessonHandlers.getLesson)
    .openapi(LessonRoutes.updateLesson, LessonHandlers.updateLesson)
    .openapi(LessonRoutes.deleteLesson, LessonHandlers.deleteLesson);
