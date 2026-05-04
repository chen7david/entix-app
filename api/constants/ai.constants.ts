/**
 * AI-related constants for models and system prompts.
 * Follows API.md Rule 54 (No Magic Strings).
 */

export const AI_MODELS = {
    DEFAULT: "gemma4:e4b",
    LESSON: "gemma4:e4b",
    QUIZ: "gemma4:e4b",
    SUMMARY: "gemma4:e4b",
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

export const AI_ENDPOINTS = {
    DEFAULT: "https://ai.entix.org/api/chat/completions",
} as const;

export const AI_DEFAULTS = {
    MAX_TOKENS: 256,
    TEMPERATURE: 0.7,
    TOP_P: 1,
} as const;
