import type { StudentVocabularyRepository } from "@api/repositories/student-vocabulary.repository";
import type { Mocked } from "vitest";
import { vi } from "vitest";

export type StudentVocabularyRepoMock = Mocked<
    Pick<
        StudentVocabularyRepository,
        | "addIfMissing"
        | "add"
        | "getBySessionWithVocab"
        | "removeById"
        | "removeByVocabAndAttendances"
    >
>;

export const makeStudentVocabularyRepoMock = (): StudentVocabularyRepoMock => ({
    addIfMissing: vi.fn(),
    add: vi.fn(),
    getBySessionWithVocab: vi.fn(),
    removeById: vi.fn(),
    removeByVocabAndAttendances: vi.fn(),
});
