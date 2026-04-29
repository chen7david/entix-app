# Vocabulary Pipeline Implementation Plan

## Decision Resolutions Summary

| Question | Decision | Impact |
| --- | --- | --- |
| Q1 | Raw URL strings in `vocabulary_bank` (no uploads/media FK) | Audio URLs are AI-generated, not user uploads, so direct URL fields are correct |
| Q2 | Unique on text only; fixed EN -> ZH scope for now | Add `UNIQUE(text)` and avoid language columns until multi-language expansion |
| Q3 | Attendance required before assigning vocabulary | `student_vocabulary.attendance_id` must FK to `session_attendances.id` |
| Q4 | Queue pipeline included in this ticket | Add `vocabulary.process-text` and `vocabulary.process-audio` queue types |
| Q5 | `org_id` denormalization is intentional | Keep for scoped queries; enforce consistency in service layer |
| Q6 | Teacher creates vocabulary; student cannot | Protect write routes with `requirePermission("vocabulary", ["create"])` |

## Phase 1 - Database Schema

### 1.1 Create `shared/db/schema/vocabulary-bank.schema.ts`
- Define `vocabulary_bank` table with:
  - `id`, `text`, `zhTranslation`, `pinyin`, `enAudioUrl`, `zhAudioUrl`, `status`, `createdAt`, `updatedAt`
- Add `VOCABULARY_BANK_STATUSES` enum values:
  - `new`, `processing_text`, `text_ready`, `processing_audio`, `active`, `review`
- Add indexes and constraints:
  - `UNIQUE(text)` as race-condition guard
  - index on `status` for queue processors
- Use `integer(..., { mode: "timestamp_ms" })` timestamps.
- `updatedAt` must include both:
  - `.default(sql\`(cast(unixepoch('subsecond') * 1000 as integer))\`)`
  - `.$onUpdate(() => new Date())`

### 1.2 Create `shared/db/schema/student-vocabulary.schema.ts`
- Define `student_vocabulary` table with:
  - `userId` FK -> `authUsers.id`
  - `orgId` FK -> `authOrganizations.id`
  - `vocabularyId` FK -> `vocabulary_bank.id`
  - `attendanceId` FK -> `session_attendances.id` (required enforcement)
  - `createdAt`
- Add unique key:
  - `(userId, vocabularyId, attendanceId)`
- Add indexes on:
  - `userId`, `orgId`, `vocabularyId`, `attendanceId`
- `updatedAt` is intentionally omitted because this is append-only assignment history.

### 1.3 Update `shared/db/schema/index.ts`
- Export:
  - `./vocabulary-bank.schema`
  - `./student-vocabulary.schema`
- Also add pre-existing missing export:
  - `./financial-session-payment-events.schema`

### 1.4 Update `shared/db/schema/relations.schema.ts`
- Add relations:
  - `vocabularyBankRelations` -> `many(studentVocabulary)`
  - `studentVocabularyRelations` -> user, organization, vocabulary, attendance
- Extend existing relations:
  - `sessionAttendancesRelations` add `studentVocabularies`
  - `authUsersRelations` add `studentVocabularies`

### 1.5 Generate migration
- Run Drizzle migration generation.
- Verify migration contains:
  - `vocabulary_bank` table + `UNIQUE(text)` + status index
  - `student_vocabulary` table + required FKs + indexes + composite unique constraint
- Note: missing export fix is schema-only and needs no migration.

## Phase 2 - Repositories

### 2.1 Create `api/repositories/vocabulary-bank.repository.ts`
- Add methods:
  - `findOrCreate(text)` with atomic `INSERT ... ON CONFLICT DO NOTHING` then `SELECT`
  - Normalize input before insert:
    - `trim()`
    - `toLowerCase()`
  - Persist normalized text so `UNIQUE(text)` reliably deduplicates case and spacing variants
  - `findById(id)`
  - `updateStatus(id, status, fields?)`
  - `getByStatus(status, limit?)`
  - `getReviewItems()`

### 2.2 Create `api/repositories/student-vocabulary.repository.ts`
- Add methods:
  - `add(input)` with explicit duplicate handling:
    - catch DB unique constraint violation
    - re-throw `ConflictError` (409) using existing app error classes
  - `getByAttendance(userId, attendanceId)`
  - `getAllForStudent(userId, orgId)`
  - `getByAttendanceWithVocab(userId, attendanceId)` with join to `vocabulary_bank`
  - `getAllForStudentWithVocab(userId, orgId)` for full-history responses with vocabulary details

### 2.3 Update `api/factories/repository.factory.ts`
- Register:
  - `getVocabularyBankRepository(ctx)`
  - `getStudentVocabularyRepository(ctx)`

## Phase 3 - AI Processing Service and Queue Integration

### 3.1 Create `api/services/vocabulary-processing.service.ts`
- Add `VocabularyProcessingService` with:
  - `processText(vocabularyId)`:
    - `new` -> `processing_text` -> parse translation/pinyin -> `text_ready`
    - use strict JSON output strategy (JSON-mode/structured output if supported by `AiService`; otherwise strict prompt contract)
    - immediately enqueue `vocabulary.process-audio` on successful transition to `text_ready`
    - fallback to `review` on failure
  - `processAudio(vocabularyId)`:
    - `text_ready` -> `processing_audio` -> generate EN/ZH audio -> `active`
    - fallback to `review` on failure
- Keep `generateTts` as temporary stub until provider integration lands.
- Define explicit TTS contract now:
  - `generateTts(text: string, lang: "en" | "zh"): Promise<string>`
  - return value is a publicly fetchable audio URL.

### 3.2 Update `api/queues/entix.queue.ts`
- Extend queue union with:
  - `{ type: "vocabulary.process-text"; vocabularyId: string }`
  - `{ type: "vocabulary.process-audio"; vocabularyId: string }`
- Add switch handlers:
  - `handleVocabularyProcessText(...)`
  - `handleVocabularyProcessAudio(...)`
- Follow existing ack/retry semantics:
  - `ack` on success
  - `retry` for transient infrastructure errors

## Phase 4 - API Routes and Handlers

### 4.1 Create `api/routes/orgs/vocabulary.routes.ts`
- Add routes:
  - `POST /orgs/{orgId}/vocabulary` (`vocabulary:create`) with request body including `sessionId` (or `attendanceId`) for origin traceability and optional auto-assignment
  - `GET /orgs/{orgId}/vocabulary/review` (`vocabulary:read`)
  - `GET /orgs/{orgId}/sessions/{sessionId}/vocabulary` (`vocabulary:read`)
  - `POST /orgs/{orgId}/sessions/{sessionId}/vocabulary/{vocabId}/assign` (`vocabulary:create`) with explicit student `userId` in request body

### 4.2 Create `api/routes/orgs/vocabulary.handlers.ts`
- `createVocabulary`:
  - `findOrCreate(text)` then enqueue `vocabulary.process-text` when status is `new`
- `listReviewVocabulary`:
  - return `getReviewItems()`
- `assignVocabularyToStudent`:
  - validate attendance belongs to org/session
  - require explicit `userId` target from request body
  - insert student vocabulary record
  - map unique collision to `ConflictError`

### 4.4 Org-scope note for review queue
- `vocabulary_bank` is global, so `listReviewVocabulary` currently returns global review items.
- Keep route under `/orgs/{orgId}/...` for permission context, but document that result is not org-filtered in this phase.

### 4.3 Create `api/routes/orgs/vocabulary.index.ts`
- Wire route group and register in `api/routes/index.route.ts`.

## Phase 5 - Final Wiring and Bug Fix

- Register vocabulary route group in `api/routes/index.route.ts`.
- Ensure `shared/db/schema/index.ts` exports `financial-session-payment-events.schema` (pre-existing fix).
- Add `VocabularyProcessingService` getter to `api/factories/service.factory.ts`.
- Add RBAC resource entries for `vocabulary` where permission registry is defined:
  - actions: `read`, `create`, `update`, `delete`
  - mirror existing registration style used by resources such as `lesson` and `schedule`.
- Confirm queue reuse:
  - `vocabulary.*` messages use existing `QUEUE` / Entix queue binding
  - no new Wrangler queue binding required unless queue architecture changes.

## Implementation Order

`Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5`

- Phase 1 is blocking.
- Phase 2 depends on Phase 1.
- Phases 3 and 4 can run in parallel after Phase 2.
- Phase 5 is final integration and wiring.

## Acceptance Criteria

- Schema enforces attendance-based assignment.
- Vocabulary deduplication is guaranteed by DB uniqueness.
- Text normalization (`trim` + `toLowerCase`) is applied before all `findOrCreate` writes.
- Queue pipeline supports text and audio stages.
- `processText` automatically enqueues `vocabulary.process-audio` on success.
- Teacher-only create/assign permissions are enforced.
- Assignment endpoint requires explicit target `userId`.
- Review state captures failed AI/TTS processing.
- Duplicate assignment returns `409 Conflict` (never raw DB error / 500).
- New routes, repositories, and service wiring compile and pass checks.
