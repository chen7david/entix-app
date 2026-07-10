import type { VocabularyBankRepository } from "@api/repositories/vocabulary/vocabulary-bank.repository";
import type { Mocked } from "vitest";
import { vi } from "vitest";

export type VocabularyBankRepoMock = Mocked<
    Pick<VocabularyBankRepository, "findOrCreate" | "findById" | "getReviewItems">
>;

export const makeVocabularyBankRepoMock = (): VocabularyBankRepoMock => ({
    findOrCreate: vi.fn(),
    findById: vi.fn(),
    getReviewItems: vi.fn(),
});
