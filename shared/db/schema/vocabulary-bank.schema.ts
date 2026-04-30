import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { generateOpaqueId } from "../../lib/id";

export const VOCABULARY_BANK_STATUSES = [
    "new",
    "processing_text",
    "text_ready",
    "processing_audio",
    "active",
    "review",
] as const;

export type VocabularyBankStatus = (typeof VOCABULARY_BANK_STATUSES)[number];

export const vocabularyBank = sqliteTable(
    "vocabulary_bank",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
        text: text("text").notNull(),
        zhTranslation: text("zh_translation"),
        pinyin: text("pinyin"),
        enAudioUrl: text("en_audio_url"),
        zhAudioUrl: text("zh_audio_url"),
        status: text("status", { enum: VOCABULARY_BANK_STATUSES }).notNull().default("new"),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex("vocabulary_bank_text_uidx").on(table.text),
        index("vocabulary_bank_status_idx").on(table.status),
    ]
);

export type VocabularyBankItem = typeof vocabularyBank.$inferSelect;
export type NewVocabularyBankItem = typeof vocabularyBank.$inferInsert;
