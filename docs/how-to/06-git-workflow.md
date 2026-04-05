<!-- AI_CONTEXT -->
<!-- This document defines the engineering workflow for git, commits, and PRs. -->

# Git Workflow & Standards

To maintain a high-velocity, high-quality codebase, we follow strict standards for branching, committing, and peer review.

## 1. Branch Naming

All feature development and bug fixes must occur on dedicated branches. Never commit directly to `main`.

**Format**: `{type}/{ticket-id}-{short-description}`

| Type | Description | Example |
| :--- | :--- | :--- |
| `feat` | New features | `feat/ENT-142-playlist-service` |
| `fix` | Bug fixes | `fix/ENT-201-null-coercion` |
| `docs` | Documentation changes | `docs/ENT-155-docs-overhaul` |
| `refactor` | Code restructuring without logic change | `refactor/ENT-188-auth-boundary` |
| `test` | Adding or fixing tests | `test/ENT-99-coverage-bump` |
| `chore` | Maintenance tasks | `chore/ENT-10-dep-update` |
| `hotfix` | Emergency production fixes | `hotfix/ENT-240-login-regression` |

## 2. Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This ensures our git history is readable and supports automated changelog generation.

### Format
```text
<type>(<scope>): <subject>

<body>

<footer>
```

### Example
```text
feat(user-service): migrate Better Auth calls from repository to service

Move signUpEmail and requestPasswordReset orchestration into UserService
to preserve repository purity and improve testability.

Resolves: ENT-142
BREAKING CHANGE: UserRepository constructor no longer accepts Auth
```

### Rules
- **Imperative mood**: Use "add" not "added", "fix" not "fixed".
- **Subject line**: Keep under 72 characters.
- **Body**: Explain the "Why" and "How", not just the "What".
- **One logical change per commit**: Do not bundle unrelated fixes.

## 3. Pull Request Standards

### Pull Request Titles
Match the branch naming/conventional commit format:
`feat(user-service): migrate Better Auth calls from repository [ENT-142]`

### Pull Request Descriptions
Every PR must use the standard template provided in the repository. It should include:
1. **Summary**: What does this PR do?
2. **Ticket Link**: Link to Jira/Linear ticket.
3. **Type of Change**: (Breaking, Feature, Fix, etc.)
4. **Changes Made**: Bulleted list of modifications.
5. **How to Test**: Step-by-step instructions for the reviewer.
6. **Checklist**: Mandatory self-review items.

### Review Etiquette
- **Small PR Preference**: Aim for <400 lines per PR. Large changes should be broken into "Stacked PRs".
- **Blocking vs Non-blocking**: Use `nit:` for minor suggestions that shouldn't block a merge.
- **Draft PRs**: Use Draft mode for work-in-progress to signal that you aren't ready for a full review but want early feedback.

## 4. Merge Strategy

- **Rebase Merge**: We prefer rebasing feature branches onto `main` to maintain a clean, linear history.
- **Squash Merge**: For small features or fixes, a squash merge is acceptable to keep the `main` branch history concise.

## 5. Branch Cleanup

Always delete your feature branch after it has been successfully merged into `main`.

---
Last updated: 2026-03-30
