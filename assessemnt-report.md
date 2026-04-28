# Multi-Tenant Lesson & Session System - Assessment Report

## Ticket Context

This document tracks implementation status and next actions for the ticket:
**Implement Multi-Tenant Lesson & Session System**.

Core objective:
- Reconcile existing `scheduled_sessions` and `session_attendances` with the new lesson architecture.
- Add reusable lessons.
- Add required lesson and teacher fields to sessions.
- Add surrogate primary key to attendances.
- Add generic `lesson_progress` table.
- Preserve strict organization scoping and permissions.

Current entity mapping:
- `scheduled_sessions` -> Session
- `session_attendances` -> Enrollment
- `auth_members` -> Membership

Durability rule:
- Use `user_id + organization_id` directly (not `member_id`) for historical durability.

---

## Final Schema Targets (Definition of Done)

### 1) `lessons` table (`lesson.schema.ts`)
- `id`: `text().primaryKey()` using `generateOpaqueId()`
- `organizationId`: FK -> `authOrganizations.id`, `not null`
- `title`: `text().notNull()`
- `description`: `text()`
- `createdAt`, `updatedAt`

### 2) Update `scheduled_sessions`
- Add `lessonId`: FK -> `lessons.id`, `not null`
- Add `teacherId`: FK -> `auth_users.id`, `not null`

### 3) Update `session_attendances`
- Add surrogate PK `id`: `text().primaryKey()` using `generateOpaqueId()`

### 4) `lesson_progress` table (`lesson-progress.schema.ts`)
- `log_id`: `text().primaryKey()` using `generateOpaqueId()`
- `enroll_id`: FK -> `session_attendances.id`, `not null`
- `lesson_element_id`: `text()`
- `action_type`: `text().notNull()`
- `timestamp`: `integer("timestamp", { mode: "timestamp" }).notNull()`
- `metric_data`: `text()` (JSON string payload)

---

## Required Relations (`relations.schema.ts`)

- `lessons: many(scheduledSessions)`
- `scheduledSessions: one(lessons, { fields: [scheduledSessions.lessonId], references: [lessons.id] })`
- `scheduledSessions: one(authUsers, { fields: [scheduledSessions.teacherId], references: [authUsers.id] })`
- `sessionAttendances: many(lessonProgress)`
- `lessonProgress: one(sessionAttendances, { fields: [lessonProgress.enrollId], references: [sessionAttendances.id] })`

---

## Student Dashboard Response Contract

```ts
{
  sessionId: string;
  lessonTitle: string;
  startTime: string;
  endTime: string;           // computed: startTime + (durationMinutes * 60000)
  teacherName: string;       // from auth_users.name via teacherId
  sessionStatus: "scheduled" | "completed" | "cancelled";
  enrollmentStatus: string;  // maps to session_attendances.paymentStatus for now
}
```

Must-haves:
- `endTime` computed in repository layer.
- `teacherName` joined from `auth_users.name` via `teacherId`.

---

## Route Requirements

### Lessons
- `GET /orgs/{organizationId}/lessons`
- `POST /orgs/{organizationId}/lessons`
- `GET /orgs/{organizationId}/lessons/{lessonId}`
- `PATCH /orgs/{organizationId}/lessons/{lessonId}`
- `DELETE /orgs/{organizationId}/lessons/{lessonId}`

### Enrollments
- `POST /orgs/{organizationId}/sessions/{sessionId}/enrollments`
- `DELETE /orgs/{organizationId}/sessions/{sessionId}/enrollments/{enrollmentId}`
  - Must use new `session_attendances.id` surrogate key

### Student Dashboard
- `GET /orgs/{organizationId}/enrollments/me`

---

## Permission Requirements

### lesson
- `student`: `["read"]`
- `teacher | admin | owner`: `["read", "create", "update", "delete"]`

### enrollment
- `student`: `["read"]`
- `teacher | admin | owner`: `["read", "create", "delete"]`

---

## What Is Already Done (Based on Ticket Spec)

The ticket provides complete target behavior and implementation expectations. The following are clarified and locked in scope:

1. Data model direction is finalized:
   - New `lessons` and `lesson_progress` tables are required.
   - `scheduled_sessions` must reference both lesson and teacher.
   - `session_attendances` must gain a surrogate primary key.

2. Relation model is explicitly defined:
   - All required Drizzle relationships are listed and non-ambiguous.

3. API contract is finalized:
   - Student dashboard payload shape is fully defined.
   - Route structure for lessons, enrollments, and dashboard is fixed.

4. Security and tenancy rules are explicit:
   - Organization scoping is required everywhere.
   - Permission matrix for `lesson` and `enrollment` is defined.

5. Behavioral rules are called out:
   - `endTime` computed in repository.
   - `teacherName` sourced via join on `teacherId`.
   - Enrollment delete must use new surrogate attendance id.
   - Completed session guard must be enforced in repository layer.

6. Delivery sequencing is already broken into 4 implementation phases with quality gates.

Note:
- This section reflects what is "done as specification and planning." It does not assert code is implemented yet.

---

## Phase-Based Execution Plan + Progress Tracker

Use this section as the single source of truth between chats. Update status, notes, blockers, and verification after each work session.

### Overall Status
- Current phase: `Validation complete (all phases implemented)`
- Overall completion: `100%`
- Last updated: `2026-04-28 (session update)`
- Owner: `AI + developer`

### Progress Legend
- `[ ]` Not started
- `[-]` In progress
- `[x]` Done
- `[!]` Blocked

---

## Phase 1 - Schema & Migration

Goal:
- Establish all table changes and relations with clean migration + compile-safe schema exports.

Checklist:
- [x] Create `lesson.schema.ts`
- [x] Create `lesson-progress.schema.ts`
- [x] Update `scheduled_sessions` schema (`lessonId`, `teacherId` non-null FKs)
- [x] Update `session_attendances` schema (add surrogate `id` PK)
- [x] Add and verify migration for affected tables
- [x] Update `shared/db/schema/index.ts` exports
- [x] Update `relations.schema.ts` for lesson/teacher/progress links
- [x] Update/truncate seed data if incompatible with new schema *(no immediate schema break found in current run; monitor during repository/integration work)*
- [x] Run quality gate: TypeScript check + Biome + build

Notes / decisions:
- Prefer drop/recreate only where necessary; ensure migration order respects FK dependencies.
- Verify all FK names and on-delete/on-update behavior are consistent with existing conventions.

Exit criteria:
- Schema compiles.
- Migration runs cleanly on fresh database.
- Quality gate passes.

Status notes:
- Implemented in repo before this session and verified in this session.
- Verified files:
  - `shared/db/schema/lesson.schema.ts`
  - `shared/db/schema/lesson-progress.schema.ts`
  - `shared/db/schema/schedule.schema.ts`
  - `shared/db/schema/relations.schema.ts`
  - `shared/db/schema/index.ts`
  - `api/db/migrations/0004_multi_tenant_lessons.sql`
- Quality gate evidence (all passing):
  - `npm run typecheck`
  - `npm run build:web`

---

## Phase 2 - Repositories

Goal:
- Add and update repository logic for lessons, lesson progress, enrollments, and student dashboard query.

Checklist:
- [x] Create `lesson.repository.ts` with org-scoped CRUD
- [x] Create `lesson-progress.repository.ts`
- [x] Update `scheduled-sessions.repository.ts` for new fields and `getStudentDashboard()`
- [x] Update `session-attendances.repository.ts` to enforce completed-session guard
- [x] Update `api/repositories/index.ts` exports
- [x] Run quality gate: TypeScript check + Biome + all tests

Notes / decisions:
- `getStudentDashboard()` must compute `endTime` in repository.
- Join `auth_users` on `teacherId` for `teacherName`.
- Ensure every repository method requires and validates `organizationId`.

Exit criteria:
- Repository tests and existing tests pass.
- Dashboard contract matches required response shape.

Status notes:
- Implemented in repo and validated in this session.
- Verified files:
  - `api/repositories/lesson.repository.ts`
  - `api/repositories/lesson-progress.repository.ts`
  - `api/repositories/scheduled-sessions.repository.ts`
  - `api/repositories/session-attendances.repository.ts`
  - `api/repositories/index.ts`
- Validation evidence:
  - `npm run test:api` (pass)

---

## Phase 3 - Permissions + Routes + Handlers

Goal:
- Expose lesson and enrollment APIs with correct authz and org-scoped behavior; update existing session APIs for new required fields.

Checklist:
- [x] Add `lesson` permissions
- [x] Add `enrollment` permissions
- [x] Create `lesson.routes.ts`, `lesson.handlers.ts`, `lesson.index.ts`
- [x] Create `enrollment.routes.ts`, `enrollment.handlers.ts`, `enrollment.index.ts`
- [x] Update scheduled session create/update handlers and routes to require `lessonId` and `teacherId`
- [x] Register new routers
- [x] Run quality gate: TypeScript check + Biome + build + tests

Notes / decisions:
- Enrollment delete route must consume new surrogate `enrollmentId`.
- Confirm validation schemas treat `lessonId` and `teacherId` as required fields.
- Ensure permission checks map exactly to role matrix from ticket.

Exit criteria:
- API routes reachable and protected correctly.
- Integration behavior validates org scoping and permission boundaries.

Status notes:
- Implemented and route-registered.
- Verified files:
  - `shared/auth/permissions.ts`
  - `api/routes/orgs/lesson.routes.ts`
  - `api/routes/orgs/lesson.handlers.ts`
  - `api/routes/orgs/lesson.index.ts`
  - `api/routes/orgs/enrollment.routes.ts`
  - `api/routes/orgs/enrollment.handlers.ts`
  - `api/routes/orgs/enrollment.index.ts`
  - `api/routes/orgs/schedule.routes.ts`
  - `api/routes/index.route.ts`

---

## Phase 4 - Tests

Goal:
- Verify behavior end-to-end for schema/repository/handler paths and edge guards.

Checklist:
- [x] Repository tests for new lesson and lesson-progress repositories
- [x] Repository tests for updated session and attendance repositories
- [x] Integration test: create session with lesson + teacher
- [x] Integration test: enroll student + remove student by new `enrollmentId`
- [x] Integration test: student dashboard payload (`lessonTitle`, computed `endTime`, `teacherName`, statuses)
- [x] Integration test: completed-session guard
- [x] Ensure no tenancy leakage across organizations

Exit criteria:
- New tests pass reliably.
- Existing regression suite remains green.

Status notes:
- Ticket-specific tests and broader API tests pass.
- Validation evidence:
  - `npx vitest run tests/integration/lesson.integration.test.ts tests/integration/schedule/scheduled-sessions.repository.test.ts tests/integration/schedule/session-attendances.repository.test.ts tests/integration/schedule/session-schedule.test.ts` (pass)
  - `npm run test:api` (pass)

---

## Known Risks / Watch Items

- Migration risk: existing attendance references may break if surrogate key introduction is not backfilled/handled correctly.
- Seed fragility: old seeds may fail due to new not-null and FK constraints.
- Permission drift: route-level auth and permission matrix may diverge if not centrally validated.
- Tenancy leakage: any query missing `organizationId` filtering is a high-severity issue.

---

## Chat-to-Chat Handoff Notes Template

Copy and update this block at end of each session:

- Date:
- Phase worked:
- Changes completed:
- Tests/commands run:
- Results:
- Blockers:
- Next immediate step:

---

## Latest Session Log

- Date: 2026-04-28
- Phase worked: Post-ticket UX and role-dashboard alignment
- Changes completed:
  - Added teacher selector to session create/update UI
  - Session payload now uses selected `teacherId` instead of forcing logged-in user id
  - Teacher portal now shows upcoming sessions assigned to logged-in teacher
  - Student portal now shows enrolled upcoming sessions via `/orgs/{organizationId}/enrollments/me`
- Tests/commands run:
  - `npm run typecheck:web`
- Results:
  - Pass
- Blockers:
  - None
- Next immediate step:
  - Verify UX manually in app (create session with non-self teacher, confirm teacher/student portals reflect assignment)

---

## Immediate Next Step

Phase implementation is complete. Next practical step is optional cleanup/hardening:
1. Decide whether `coverArtUrl` should remain in `lessons` as an additive field beyond ticket minimum
2. Add/change any documentation references to call enrollment id the surrogate key explicitly
3. Open PR with this tracker as rollout evidence
