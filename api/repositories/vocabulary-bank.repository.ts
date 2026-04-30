import type { AppDb } from "@api/factories/db.factory";
import type { VocabularyBankItem, VocabularyBankStatus } from "@shared/db/schema";
import { vocabularyBank } from "@shared/db/schema";
import { and, eq, lt, or } from "drizzle-orm";

export class VocabularyBankRepository {
    constructor(private readonly db: AppDb) {}

    async findOrCreate(text: string): Promise<VocabularyBankItem> {
        const normalizedText = text.trim().toLowerCase();

        await this.db
            .insert(vocabularyBank)
            .values({
                text: normalizedText,
                status: "new",
            })
            .onConflictDoNothing();

        const [item] = await this.db
            .select()
            .from(vocabularyBank)
            .where(eq(vocabularyBank.text, normalizedText))
            .limit(1);

        if (!item) {
            throw new Error(`Vocabulary bank item not found after upsert: "${normalizedText}"`);
        }

        return item;
    }

    async findById(id: string): Promise<VocabularyBankItem | null> {
        const [item] = await this.db
            .select()
            .from(vocabularyBank)
            .where(eq(vocabularyBank.id, id))
            .limit(1);

        return item ?? null;
    }

    async updateStatus(
        id: string,
        status: VocabularyBankStatus,
        fields?: Partial<
            Pick<VocabularyBankItem, "zhTranslation" | "pinyin" | "enAudioUrl" | "zhAudioUrl">
        >
    ): Promise<VocabularyBankItem | null> {
        const [item] = await this.db
            .update(vocabularyBank)
            .set({ status, ...fields, updatedAt: new Date() })
            .where(eq(vocabularyBank.id, id))
            .returning();

        return item ?? null;
    }

    async getByStatus(status: VocabularyBankStatus, limit = 50): Promise<VocabularyBankItem[]> {
        return this.db
            .select()
            .from(vocabularyBank)
            .where(eq(vocabularyBank.status, status))
            .limit(limit);
    }

    async getReviewItems(): Promise<VocabularyBankItem[]> {
        return this.getByStatus("review");
    }

    /**
     * Items stuck in text/audio processing (e.g. transient AI/TTS failure).
     * Caller should re-enqueue queue messages for retry.
     */
    async findStaleProcessing(olderThan: Date, limit = 40): Promise<VocabularyBankItem[]> {
        return this.db
            .select()
            .from(vocabularyBank)
            .where(
                and(
                    or(
                        eq(vocabularyBank.status, "processing_text"),
                        eq(vocabularyBank.status, "processing_audio")
                    ),
                    lt(vocabularyBank.updatedAt, olderThan)
                )
            )
            .limit(limit);
    }
}
