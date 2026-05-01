import { createRouter } from "@api/lib/app.lib";
import { VocabularyHandlers } from "./vocabulary.handlers";
import { VocabularyRoutes } from "./vocabulary.routes";

export const vocabularyRoutes = createRouter()
    .openapi(VocabularyRoutes.createVocabulary, VocabularyHandlers.createVocabulary)
    .openapi(VocabularyRoutes.listReviewVocabulary, VocabularyHandlers.listReviewVocabulary)
    .openapi(VocabularyRoutes.listSessionVocabulary, VocabularyHandlers.listSessionVocabulary)
    .openapi(
        VocabularyRoutes.assignVocabularyToStudent,
        VocabularyHandlers.assignVocabularyToStudent
    );
