import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { generateOpaqueId } from "../../lib/id";

export const VOCABULARY_BANK_STATUSES = [
    "new",
    "queued_text",
    "processing_text",
    "text_ready",
    "queued_audio",
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
        needsLanguageReview: integer("needs_language_review", { mode: "boolean" }),
        ipaUs: text("ipa_us"),
        syllablesEn: text("syllables_en"),
        syllablesIpa: text("syllables_ipa"),
        definitionSimple: text("definition_simple"),
        enAudioUrl: text("en_audio_url"),
        zhAudioUrl: text("zh_audio_url"),
        status: text("status", { enum: VOCABULARY_BANK_STATUSES }).notNull().default("new"),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        /**
         * DB default applies on INSERT only (SQLite). Repository `.update()` / `.set()` must still pass
         * `updatedAt` where we rely on fresh timestamps; Drizzle `$onUpdate` does not create a DB trigger.
         */
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex("vocabulary_bank_text_uidx").on(table.text),
        index("vocabulary_bank_status_idx").on(table.status),
        check(
            "vb_status_check",
            sql`${table.status} IN ('new', 'queued_text', 'processing_text', 'text_ready', 'queued_audio', 'processing_audio', 'active', 'review')`
        ),
    ]
);

export type VocabularyBankItem = typeof vocabularyBank.$inferSelect;
export type NewVocabularyBankItem = typeof vocabularyBank.$inferInsert;
