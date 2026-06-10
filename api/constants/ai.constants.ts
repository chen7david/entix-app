/**
 * AI-related constants for models and system prompts.
 * Follows API.md Rule 54 (No Magic Strings).
 */

export const AI_MODELS = {
    DEFAULT: "gemini-2.5-flash",
    LESSON: "gemini-2.5-flash",
    QUIZ: "gemini-2.5-flash",
    SUMMARY: "gemini-2.5-flash",
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

export const AI_DEFAULTS = {
    MAX_TOKENS: 256,
    TEMPERATURE: 0.7,
    TOP_P: 1,
} as const;

/** Global Gemini `generateContent` cap (RPM), enforced before every API call including queue retries. */
export const GEMINI_MAX_REQUESTS_PER_MINUTE = 10;
