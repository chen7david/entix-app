# Git Workflow & Branch Protection

How we collaborate and ship code.

## 1. Feature Branches
Never push directly to `main`. Create a branch from `staging` (our current development base):
```bash
git checkout -b feature/my-new-feature
```

## 2. Commit Standards
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat`: A new feature
- `fix`: A bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature

## 3. Pull Requests (PRs)
1. Push your branch: `git push origin feature/my-new-feature`
2. Open a PR to `main`.
3. Wait for **Status Checks** (Cloudflare Pages Preview) to pass.

## 4. Branch Protection Rules
- **Require PRs**: Direct pushes to `main` are blocked.
- **Approvals**: Minimum 1 approval required (self-approvals allowed for rapid iteration).
- **Status Checks**: "Cloudflare Pages" build must be green before merge.

[Why branch protection?](../why/branch-protection.md)

Last updated: 2026-03-12
[Back to Documentation Guide](../how-to-write-docs.md)
