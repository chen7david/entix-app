# Vocab AI Tester Incident Report

## What went wrong

1. **Wrong dev runtime mode for AI**
   - We initially ran API with `wrangler dev --local`.
   - In that mode, `env.AI` was marked `not supported`, which caused:
     - `Binding AI needs to be run remotely`
   - This made `/api/v1/vocab-ai-test` fail with `502`.

2. **`--remote` preview introduced separate infra failures**
   - Switching to `--remote` hit Cloudflare preview/runtime issues:
     - invalid local KV id (`local`) in remote context
     - edge `1105` temporary unavailable responses
   - Auth routes returned `503` because the preview worker crashed before app logic completed.

3. **Model output shape mismatch and weak diagnostics**
   - AI returned wrapped JSON:
     - `{"response":{"zh_translation":"","pinyin":"shuǐ","needs_language_review":false}}`
   - Parser expected top-level fields, so it failed validation.
   - Error originally hid the actual raw payload behind generic:
     - `AI output is not valid translation JSON`

4. **Prompt constraints were too weak for content quality**
   - Even after shape handling, model sometimes returned empty `zh_translation`.
   - This indicated instruction quality issue, not just parser issue.

## Root causes

- **Environment/runtime mismatch**: AI requires remote binding access; `--local` blocked it.
- **Over-reliance on `--remote` preview**: unstable for this setup and conflicted with local-only bindings.
- **Route-level parsing hacks**: validation and normalization lived in one route file with manual checks.
- **Lack of explicit schema contract at the API boundary** for request/response and model output envelopes.

## What fixed it

- Use `wrangler dev` (no `--local`, no `--remote`) so AI binding runs in remote mode while other resources stay local-compatible.
- Keep concurrent startup with dedicated scripts (`dev:ai`, `dev:api:remote`).
- Improve tester API diagnostics:
  - return `raw` model output
  - return `parsedJson` when parse succeeds but schema fails
  - return field-level validation errors
- Add envelope unwrapping (`response`, `result`, `data`) before validation.
- Harden prompts to require non-empty Simplified Chinese `zh_translation`.

## Why current implementation feels hacky

Yes, current `vocab-ai-test` route is functional but mixed concerns:
- request parsing
- model selection/defaults
- prompt assembly
- AI invocation
- output normalization
- error mapping

all in one file, with manual type narrowing and ad-hoc guards.

## Cleanup plan (recommended)

1. **Add Zod schemas for API boundary**
   - `VocabAiTestRequestSchema`
   - `VocabAiModelOutputSchema`
   - `VocabAiTestSuccessSchema`
   - `VocabAiTestErrorSchema`
   - Validate request once at entry; return typed errors.

2. **Extract route logic into a dedicated service**
   - `VocabAiTestService`:
     - build prompt
     - call `AiService`
     - normalize envelopes
     - validate output
     - produce typed result (`success | failure`)

3. **Centralize normalization**
   - Keep envelope unwrapping in one utility (`normalizeAiJsonEnvelope`), with tests.
   - Avoid duplicating wrapper handling across routes/services.

4. **Strengthen JSON schema contract**
   - Keep `response_format: json_schema`.
   - Optionally add `minLength: 1` for `zh_translation`/`pinyin` in AI schema (if supported consistently by Workers AI model path).
   - Keep runtime Zod validation as final guard regardless.

5. **Make failure modes explicit**
   - Distinguish:
     - invalid JSON text
     - wrong shape
     - empty required values
     - upstream AI runtime error
   - Map each to stable API error codes for frontend display.

6. **Add focused tests**
   - parser accepts top-level and wrapped payloads
   - parser rejects empty fields
   - route returns `422` with `raw`/`parsedJson` on semantic validation errors
   - route returns `502` for upstream AI failures

## Suggested target architecture

- Route: thin (parse request, call service, map response)
- Service: business logic
- Schema module: Zod contracts
- Utility module: envelope normalization
- Tests: parser + route contract

This will remove most of the current route-level branching and make behavior deterministic, testable, and easier to iterate on for prompt tuning.
