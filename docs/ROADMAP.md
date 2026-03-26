# Project Roadmap & Progress Log

This document tracks the evolution of the Entix App, documenting major technical milestones and outlining future priorities.

## ✅ Completed Today (2026-03-26)

### 1. Data Portability: Full-Scope Member Import/Export
- **Achievement**: Expanded the bulk import/export system to handle the complete entity lifecycle, including original IDs and system timestamps.
- **Key Files**: `bulk-member.service.ts`, `bulk-member.dto.ts`.

### 2. Infrastructure: D1 Parameter Limit Resolution
- **Achievement**: Solved a critical 500 error where Cloudflare D1 would crash on organizations with 100+ members due to SQL variable limits.
- **Implementation**: Created `patchD1Adapter` to automatically batch large `IN` clause queries.
- **Key Files**: `api/helpers/auth-adapter.helpers.ts`.

### 3. Architecture: Unified Asset Naming Convention
- **Achievement**: Refactored the database and repository layers to follow the project's "Implicit Org Scope" philosophy.
- **Convention**: `uploads` (organizationally scoped) vs. `user_uploads` (globally user-owned).
- **Documentation**: Updated `docs/architecture/NAMING.md`.

### 4. Stability: Auth Route Optimization
- **Achievement**: Fixed runtime `ReferenceError` issues caused by external helper dependencies and resolved `jsonContentRequired` loading errors.

---

## 🚀 Future Work & Priorities

### 🔥 High Priority
1.  **Performance Refactor: Schedule List Joins**
    - **Current State**: `getSessionsForOrg` uses nested relational queries to fetch all attendees per session in a list view.
    - **Target**: Optimize to fetch only session headers in the list; load attendee details on-demand.
2.  **Access Control: Student Role Implementation**
    - Define and implement a dedicated `student` role with restricted, self-service permissions (e.g., viewing their own schedule only).

### ⚡ Medium Priority
1.  **UX: Infinite Scroll Transition**
    - Replace existing page-based pagination with a "load-on-scroll" infinite scroll pattern for smoother data Exploration.
2.  **Feature: Paginated Search for Member Assignment**
    - Implement server-side search and pagination for workflows where members are assigned to sessions or teams.

### 🍃 Low Priority
1.  **UI: Layout Height & Overflow Fixes**
    - Resolve the dashboard "cut-off" issue where content is occasionally hidden at the bottom of the viewport.

---

*Last Updated: 2026-03-26*
