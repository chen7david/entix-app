## Summary

<!-- Briefly describe the goal of this PR. What is the business/architectural value? -->

## Ticket Link

<!-- Link to Jira / Linear / GitHub Issue (e.g., ENT-142) -->

## Type of Change

- [ ] ✨ Feature  
- [ ] 🐛 Bug Fix  
- [ ] 🛠 Refactor  
- [ ] 📚 Documentation  
- [ ] 🧪 Testing  
- [ ] 🚀 Hotfix  

## Changes Made

<!-- List of specific modifications in bulleted format -->

- 💎 **Architecture**: (e.g., Migrated auth logic to Service layer)
- 📡 **Routes**: (e.g., Added GET /api/v1/playlists)
- 🗄️ **Database**: (e.g., New columns added to playlists table)
- 🎨 **UI**: (e.g., Updated sidebar UI for mobile responsive)

## How to Test

<!-- Step-by-step instructions for the reviewer. List specific test inputs or URLs. -->

1. 🌐 Navigate to `/org/:slug/dashboard`
2. 🖱️ Click "Add Playlist"
3. ✅ Confirm the playlist appears in the database and list

## Risks / Rollback Notes

- [ ] New environment variables added
- [ ] Database migration required
- [ ] High impact to existing functionality

## Screenshots (If UI changed)

<!-- Drop before/after screenshots here -->

---

## 🏗 Checklist

- [ ] **Typecheck**: `npm run typecheck:api` passes.
- [ ] **Tests**: `npm run test:api` (or relevant unit tests) passes.
- [ ] **Patterns**: No direct repository access from handlers. All DB logic is in Services.
- [ ] **Boundaries**: No external clients (Better Auth, Stripe, etc.) in Repositories.
- [ ] **Resilience**: `get*` methods have corresponding `NotFoundError` test cases.
- [ ] **Documentation**: `docs/` updated if new architecture patterns were introduced.
- [ ] **AI Context**: `docs/AI.md` updated if canonical rules changed.
