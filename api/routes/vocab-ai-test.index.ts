import { BadRequestError } from "@api/errors/app.error";
import { createAiService } from "@api/factories/ai.factory";
import type { AppOpenApi } from "@api/helpers/types.helpers";
import { createRouter } from "@api/lib/app.lib";
import type { AiService } from "@api/services/ai.service";
import type { AiJsonSchema } from "@api/types/ai.types";

const DEFAULT_SYSTEM_PROMPT =
    "You are a translation API. Respond with raw JSON only. No markdown, no code fences, no explanation. Your entire response must be a single valid JSON object. Always provide a non-empty Simplified Chinese value for zh_translation.";

const VOCAB_TRANSLATION_SCHEMA: AiJsonSchema = {
    type: "object",
    properties: {
        zh_translation: { type: "string" },
        pinyin: { type: "string" },
        needs_language_review: { type: "boolean" },
    },
    required: ["zh_translation", "pinyin", "needs_language_review"],
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
            "Return zh_translation in Simplified Chinese characters (not English, not empty).",
            "If uncertain, still provide your best non-empty translation and set needs_language_review=true.",
            "Set needs_language_review to true only if the phrase is misspelled, ungrammatical, or unsuitable study vocabulary.",
            `English phrase: "${phrase}"`,
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
    const fieldErrors: string[] = [];

    if (typeof zh !== "string") fieldErrors.push("`zh_translation` must be a string");
    else if (zh.trim().length === 0) fieldErrors.push("`zh_translation` must be non-empty");

    if (typeof pinyin !== "string") fieldErrors.push("`pinyin` must be a string");
    else if (pinyin.trim().length === 0) fieldErrors.push("`pinyin` must be non-empty");

    if (typeof review !== "boolean") fieldErrors.push("`needs_language_review` must be a boolean");

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
    return "zh_translation" in value || "pinyin" in value || "needs_language_review" in value;
}
