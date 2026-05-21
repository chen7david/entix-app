import type {
    VocabularyItemDTO,
    VocabularyStatus,
} from "@web/src/features/vocabulary/hooks/useVocabulary";
import type { DocumentMeta } from "../../shared/document.types";

/** Statuses that represent a vocabulary item that is finalized enough to
 * be included in printed materials. Any new printable status (e.g.
 * "approved") must be added here explicitly so we never silently exclude
 * words from a printout. */
export const PRINTABLE_VOCABULARY_STATUSES = [
    "active",
    "text_ready",
    "review",
] as const satisfies readonly VocabularyStatus[];

export type PrintableVocabularyStatus = (typeof PRINTABLE_VOCABULARY_STATUSES)[number];

export function isPrintableVocabulary(item: VocabularyItemDTO): boolean {
    return (PRINTABLE_VOCABULARY_STATUSES as readonly VocabularyStatus[]).includes(item.status);
}

/** Session class vocabulary print: primary line is the session title, secondary is the linked lesson. */
export interface SessionWordListDocumentData {
    kind: "session";
    sessionName: string;
    lessonName: string;
    words: VocabularyItemDTO[];
    meta: DocumentMeta;
}

/** Lesson-only vocabulary print (e.g. org teaching lesson detail): no session title. */
export interface LessonWordListDocumentData {
    kind: "lesson";
    lessonTitle: string;
    /** Shown under the title (e.g. CEFR line). */
    subtitleLines?: readonly string[];
    words: VocabularyItemDTO[];
    meta: DocumentMeta;
}

export type WordListDocumentData = SessionWordListDocumentData | LessonWordListDocumentData;
