import { BadRequestError } from "@api/errors/app.error";
import { createAiService } from "@api/factories/ai.factory";
import type { AppOpenApi } from "@api/helpers/types.helpers";
import { createRouter } from "@api/lib/app.lib";
import type { AiService } from "@api/services/ai.service";
import type { AiJsonSchema } from "@api/types/ai.types";

const DEFAULT_SYSTEM_PROMPT = [
    "You are a vocabulary enrichment API.",
    "Respond with raw JSON only. NO markdown, NO code fences, NO explanation. Just the JSON object.",
    "Exactly these keys: zh_translation, pinyin, needs_language_review, ipa_us, syllables_en, syllables_ipa, definition_simple.",
    "All fields must be non-empty strings, except needs_language_review which is boolean.",
].join("\n");

const VOCAB_TRANSLATION_SCHEMA: AiJsonSchema = {
    type: "object",
    properties: {
        zh_translation: { type: "string" },
        pinyin: { type: "string" },
        needs_language_review: { type: "boolean" },
        ipa_us: { type: "string" },
        syllables_en: { type: "string" },
        syllables_ipa: { type: "string" },
        definition_simple: { type: "string" },
    },
    required: [
        "zh_translation",
        "pinyin",
        "needs_language_review",
        "ipa_us",
        "syllables_en",
        "syllables_ipa",
        "definition_simple",
    ],
    additionalProperties: false,
};

const PINYIN_REPAIR_SCHEMA: AiJsonSchema = {
    type: "object",
    properties: {
        pinyin: { type: "string" },
    },
    required: ["pinyin"],
    additionalProperties: false,
};

type VocabAiTestRequest = {
    phrase?: unknown;
    systemPrompt?: unknown;
    temperature?: unknown;
    maxTokens?: unknown;
};

type ParsedTranslation = {
    zh_translation: string;
    pinyin: string;
    needs_language_review: boolean;
    ipa_us: string;
    syllables_en: string;
    syllables_ipa: string;
    definition_simple: string;
};

type ParseFailure = {
    error: string;
    raw: string;
    parsedJson: unknown | null;
};

const _vocabAiTestRouter = createRouter()
    .post("/vocab-ai-test", async (c) => {
        const payload = (await c.req.json()) as VocabAiTestRequest;
        const phrase = String(payload.phrase ?? "").trim();
        if (!phrase) throw new BadRequestError("`phrase` is required");

        const systemPrompt = parseSystemPrompt(payload.systemPrompt);
        const temperature = parseTemperature(payload.temperature);
        const maxTokens = parseMaxTokens(payload.maxTokens);

        const ai = createAiService(c, {
            systemPrompt,
            defaults: {
                temperature,
                maxTokens,
                responseFormat: {
                    type: "json_schema",
                    json_schema: VOCAB_TRANSLATION_SCHEMA,
                },
            },
        });

        const prompt = [
            "Translate this English phrase to Mandarin Chinese.",
            "Return zh_translation in Simplified Chinese characters (not English, never empty).",
            "If uncertain about translation quality, still provide your best translation and set needs_language_review to true.",
            "Return ipa_us as the American English IPA transcription of the phrase.",
            "Return syllables_en as the phrase with hyphen-separated syllables within each word, spaces preserved between words.",
            "Return syllables_ipa as the IPA transcription with hyphen-separated syllables within each word, spaces preserved between words.",
            "Return definition_simple as a 1-sentence definition a 7-year-old can understand.",
            `English phrase: ${phrase}`,
        ].join("\n");

        const result = await ai.generate(prompt);
        const parsed = parseTranslationResponse(result.text);

        if ("error" in parsed) {
            const repaired = await tryRepairMissingPinyin({
                ai,
                phrase,
                originalParsedJson: parsed.parsedJson,
            });

            if (repaired) {
                return c.json({
                    data: {
                        model: ai.getModel(),
                        prompt,
                        result: repaired.result,
                        raw: result.text,
                        repair: {
                            applied: true,
                            reason: "missing_pinyin",
                            raw: repaired.repairRaw,
                        },
                        generatedAt: result.generatedAt,
                    },
                });
            }

            return c.json(
                {
                    data: {
                        error: parsed.error,
                        model: ai.getModel(),
                        prompt,
                        raw: parsed.raw,
                        parsedJson: parsed.parsedJson,
                        generatedAt: result.generatedAt,
                    },
                },
                422
            );
        }

        return c.json({
            data: {
                model: ai.getModel(),
                prompt,
                result: parsed,
                raw: result.text,
                generatedAt: result.generatedAt,
            },
        });
    })
    .post("/vocab-ai-test/openwebui-models", async (c) => {
        const ai = createAiService(c, {});
        const models = await ai.fetchModels();
        return c.json({ data: { models } });
    });

/** Cast: plain `.post()` narrows to `Hono`; `mountRoutes` expects `OpenAPIHono` (TEMP route). */
export const vocabAiTestRoutes = _vocabAiTestRouter as AppOpenApi;

// ---------------------------------------------------------------------------
// Request param parsers — client-supplied tuning values only
// ---------------------------------------------------------------------------

function parseSystemPrompt(systemPrompt: unknown): string {
    if (typeof systemPrompt !== "string") return DEFAULT_SYSTEM_PROMPT;
    const trimmed = systemPrompt.trim();
    return trimmed.length > 0 ? trimmed : DEFAULT_SYSTEM_PROMPT;
}

function parseTemperature(temperature: unknown): number {
    if (typeof temperature === "number") return temperature;
    if (typeof temperature === "string" && temperature.trim() !== "") {
        const parsed = Number.parseFloat(temperature);
        if (!Number.isNaN(parsed)) return parsed;
    }
    return 0.1;
}

function parseMaxTokens(maxTokens: unknown): number {
    if (typeof maxTokens === "number") return Math.max(1, Math.floor(maxTokens));
    if (typeof maxTokens === "string" && maxTokens.trim() !== "") {
        const parsed = Number.parseInt(maxTokens, 10);
        if (!Number.isNaN(parsed)) return Math.max(1, parsed);
    }
    return 512;
}

// ---------------------------------------------------------------------------
// Pinyin repair
// ---------------------------------------------------------------------------

async function tryRepairMissingPinyin(input: {
    ai: AiService;
    phrase: string;
    originalParsedJson: unknown | null;
}): Promise<{ result: ParsedTranslation; repairRaw: string } | null> {
    const candidate = unwrapCandidateObject(input.originalParsedJson);
    if (!candidate) return null;
    if (
        typeof candidate.zh_translation !== "string" ||
        candidate.zh_translation.trim().length === 0
    )
        return null;
    if (typeof candidate.needs_language_review !== "boolean") return null;
    if (typeof candidate.ipa_us !== "string") return null;
    if (typeof candidate.syllables_en !== "string") return null;
    if (typeof candidate.syllables_ipa !== "string") return null;
    if (typeof candidate.definition_simple !== "string") return null;
    if (typeof candidate.pinyin === "string" && candidate.pinyin.trim().length > 0) return null;

    const repairPrompt = [
        "Return JSON only with key `pinyin`.",
        "Given this English phrase and Chinese translation, output non-empty Hanyu pinyin with tone marks.",
        `English phrase: "${input.phrase}"`,
        `Chinese translation: "${candidate.zh_translation}"`,
    ].join("\n");

    const repairResult = await input.ai.generate(repairPrompt, {
        responseFormat: {
            type: "json_schema",
            json_schema: PINYIN_REPAIR_SCHEMA,
        },
    });

    const pinyin = parsePinyinRepair(repairResult.text);
    if (!pinyin) return null;

    return {
        result: {
            zh_translation: candidate.zh_translation,
            pinyin,
            needs_language_review: candidate.needs_language_review,
            ipa_us: candidate.ipa_us,
            syllables_en: candidate.syllables_en,
            syllables_ipa: candidate.syllables_ipa,
            definition_simple: candidate.definition_simple,
        },
        repairRaw: repairResult.text,
    };
}

function parsePinyinRepair(raw: string): string | null {
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const candidate = typeof parsed.pinyin === "string" ? parsed.pinyin.trim() : "";
        return candidate.length > 0 ? candidate : null;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Translation response parsing
// ---------------------------------------------------------------------------

function parseTranslationResponse(raw: string): ParsedTranslation | ParseFailure {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error: unknown) {
        return {
            error: `AI output is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
            raw,
            parsedJson: null,
        };
    }

    const candidate = unwrapCandidateObject(parsed);
    if (!candidate) return { error: "AI output JSON is not an object", raw, parsedJson: parsed };

    const zh = candidate.zh_translation;
    const pinyin = candidate.pinyin;
    const review = candidate.needs_language_review;
    const ipaUs = candidate.ipa_us;
    const syllablesEn = candidate.syllables_en;
    const syllablesIpa = candidate.syllables_ipa;
    const definitionSimple = candidate.definition_simple;

    const fieldErrors: string[] = [];

    if (typeof zh !== "string") fieldErrors.push("`zh_translation` must be a string");
    else if (zh.trim().length === 0) fieldErrors.push("`zh_translation` must be non-empty");

    if (typeof pinyin !== "string") fieldErrors.push("`pinyin` must be a string");
    else if (pinyin.trim().length === 0) fieldErrors.push("`pinyin` must be non-empty");

    if (typeof review !== "boolean") fieldErrors.push("`needs_language_review` must be a boolean");

    if (typeof ipaUs !== "string") fieldErrors.push("ipa_us must be a string");
    else if (ipaUs.trim().length === 0) fieldErrors.push("ipa_us must be non-empty");

    if (typeof syllablesEn !== "string") fieldErrors.push("syllables_en must be a string");
    else if (syllablesEn.trim().length === 0) fieldErrors.push("syllables_en must be non-empty");

    if (typeof syllablesIpa !== "string") fieldErrors.push("syllables_ipa must be a string");
    else if (syllablesIpa.trim().length === 0) fieldErrors.push("syllables_ipa must be non-empty");

    if (typeof definitionSimple !== "string")
        fieldErrors.push("definition_simple must be a string");
    else if (definitionSimple.trim().length === 0)
        fieldErrors.push("definition_simple must be non-empty");

    if (fieldErrors.length > 0) {
        return {
            error: `AI output is not valid translation JSON: ${fieldErrors.join("; ")}`,
            raw,
            parsedJson: parsed,
        };
    }

    return {
        zh_translation: zh as string,
        pinyin: pinyin as string,
        needs_language_review: review as boolean,
        ipa_us: ipaUs as string,
        syllables_en: syllablesEn as string,
        syllables_ipa: syllablesIpa as string,
        definition_simple: definitionSimple as string,
    };
}

function unwrapCandidateObject(input: unknown): Record<string, unknown> | null {
    if (typeof input !== "object" || input === null) return null;
    const obj = input as Record<string, unknown>;
    if (isTranslationShape(obj)) return obj;

    for (const key of ["response", "result", "data"] as const) {
        const nested = obj[key];
        if (typeof nested === "object" && nested !== null) {
            const nestedObj = nested as Record<string, unknown>;
            if (isTranslationShape(nestedObj)) return nestedObj;
        }
        if (typeof nested === "string" && nested.trim().startsWith("{")) {
            try {
                const reparsed = JSON.parse(nested) as unknown;
                if (typeof reparsed === "object" && reparsed !== null) {
                    const reparsedObj = reparsed as Record<string, unknown>;
                    if (isTranslationShape(reparsedObj)) return reparsedObj;
                }
            } catch {
                // no-op
            }
        }
    }
    return obj;
}

function isTranslationShape(value: Record<string, unknown>): boolean {
    return (
        "zh_translation" in value &&
        "pinyin" in value &&
        "needs_language_review" in value &&
        "ipa_us" in value &&
        "syllables_en" in value &&
        "syllables_ipa" in value &&
        "definition_simple" in value
    );
}
