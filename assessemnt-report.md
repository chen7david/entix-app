# Cloudflare AI Service Assessment Report

## Objective
Set up a Cloudflare Workers AI service layer with strict typing, separated concerns, reusable presets, and verification to ensure no existing behavior is broken.

## Phase Plan

### Phase 1 - Type and Contract Baseline
- Add shared AI types to `api/types/ai.types.ts`.
- Define supported model union (`AiTextModel`) and message/result/config contracts.
- Keep Cloudflare request options camelCase in app code and map to snake_case only at API boundary.

### Phase 2 - Prompt Isolation
- Add reusable prompt constants in:
  - `api/ai/prompts/lesson.prompt.ts`
  - `api/ai/prompts/quiz.prompt.ts`
  - `api/ai/prompts/summary.prompt.ts`
- Remove hardcoded prompt strings from service/factory logic.

### Phase 3 - Helper Extraction
- Add `api/helpers/ai.helpers.ts` for:
  - option resolution (`resolveAiRunParams`)
  - message construction (`buildMessages`)
  - response extraction (`extractAiText`)
- Keep helper functions pure and stateless.

### Phase 4 - Thin Service Orchestration
- Add `api/services/ai.service.ts`.
- Service responsibilities:
  - hold validated config
  - call Workers AI
  - map failures to `InternalServerError` or `ServiceUnavailableError`
- Add fail-fast guard for missing `ctx.env.AI` binding.

### Phase 5 - Factory Split
- Add `api/factories/ai.factory.ts` as the core constructor factory.
- Add `api/factories/ai.presets.ts` for named preset factories.
- Keep preset creation open for extension without modifying core constructor code.

### Phase 6 - Validation and Regression Safety
- Add unit tests:
  - `tests/unit/ai.helpers.test.ts`
  - `tests/unit/ai.service.test.ts`
- Run targeted tests and lint checks after implementation.
- Confirm no unrelated tracked files are modified by this setup.

## Acceptance Criteria
- AI types are centralized.
- Prompts are centralized.
- Service is thin and focused.
- Factory concerns are split (core vs presets).
- Missing AI binding throws immediately.
- New tests pass.
- Existing repo checks show no regressions from these changes.

## Validation Results
- Targeted tests passed:
  - `tests/unit/ai.helpers.test.ts`
  - `tests/unit/ai.service.test.ts`
- API typecheck passed with `npm run typecheck:api`.
- Lint diagnostics on new files report no IDE lint errors.
