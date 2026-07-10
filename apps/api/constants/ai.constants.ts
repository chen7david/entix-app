/**
 * AI-related constants for models and system prompts.
 * Follows API.md Rule 54 (No Magic Strings).
 */

/** Active text inference backends. Default is DeepSeek for production. */
export const AI_PROVIDERS = {
    DEEPSEEK: "deepseek",
    GEMINI: "gemini",
} as const;

export type AiProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];

/** DeepSeek V4-Flash: best fit for vocabulary JSON, queue volume, and general text (replaces Gemini Flash). */
export const DEEPSEEK_MODELS = {
    DEFAULT: "deepseek-v4-flash",
    PRO: "deepseek-v4-pro",
} as const;

export const GEMINI_MODELS = {
    DEFAULT: "gemini-2.5-flash",
} as const;

/** Default model ids per workflow — resolved via {@link AI_PROVIDERS} at runtime. */
export const AI_MODELS = {
    DEFAULT: DEEPSEEK_MODELS.DEFAULT,
    LESSON: DEEPSEEK_MODELS.DEFAULT,
    QUIZ: DEEPSEEK_MODELS.DEFAULT,
    SUMMARY: DEEPSEEK_MODELS.DEFAULT,
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

export const AI_DEFAULTS = {
    MAX_TOKENS: 256,
    TEMPERATURE: 0.7,
    TOP_P: 1,
} as const;

export const DEEPSEEK_API_BASE_URL = "https://api.deepseek.com";

/** Inference request timeout shared by DeepSeek and Gemini clients. */
export const AI_REQUEST_TIMEOUT_MS = 55_000;
