import { createRouter } from "@api/lib/app.lib";
import { LessonContentHandlers } from "./lesson-content.handlers";
import { LessonContentRoutes } from "./lesson-content.routes";

export const lessonContentRoutes = createRouter()
    .openapi(LessonContentRoutes.listObjectives, LessonContentHandlers.listObjectives)
    .openapi(LessonContentRoutes.replaceObjectives, LessonContentHandlers.replaceObjectives)
    .openapi(LessonContentRoutes.reorderObjectives, LessonContentHandlers.reorderObjectives)
    .openapi(LessonContentRoutes.listLessonPlaylists, LessonContentHandlers.listLessonPlaylists)
    .openapi(LessonContentRoutes.addLessonPlaylist, LessonContentHandlers.addLessonPlaylist)
    .openapi(
        LessonContentRoutes.reorderLessonPlaylists,
        LessonContentHandlers.reorderLessonPlaylists
    )
    .openapi(LessonContentRoutes.removeLessonPlaylist, LessonContentHandlers.removeLessonPlaylist)
    .openapi(LessonContentRoutes.listLessonVocabulary, LessonContentHandlers.listLessonVocabulary)
    .openapi(LessonContentRoutes.addLessonVocabulary, LessonContentHandlers.addLessonVocabulary)
    .openapi(
        LessonContentRoutes.reorderLessonVocabulary,
        LessonContentHandlers.reorderLessonVocabulary
    )
    .openapi(
        LessonContentRoutes.removeLessonVocabulary,
        LessonContentHandlers.removeLessonVocabulary
    )
    .openapi(LessonContentRoutes.listLessonPassages, LessonContentHandlers.listLessonPassages)
    .openapi(LessonContentRoutes.addLessonPassage, LessonContentHandlers.addLessonPassage)
    .openapi(
        LessonContentRoutes.reorderLessonPassages,
        LessonContentHandlers.reorderLessonPassages
    )
    .openapi(LessonContentRoutes.removeLessonPassage, LessonContentHandlers.removeLessonPassage);
