# Deployment Workflow

How our code reaches production.

## 1. Automated Previews
Every Pull Request to `main` triggers an automatic build on Cloudflare Pages.
- A comment is posted to the PR with a unique preview link.
- Status checks must pass before merging.

## 2. GitHub Branch Protection
We enforce the following rules on the `main` branch:
1. **Pull Request Required**: Direct pushes are blocked.
2. **Review Required**: Minimum 1 approval needed.
3. **Build Required**: Cloudflare Pages status check must be green.

## 3. Production Deployment
Merging a PR into `main` automatically deploys the latest code to:
- **API**: Distributed globally via Cloudflare Workers.
- **Frontend**: Hosted on Cloudflare Pages.

[Why use Cloudflare Pages?](../why/cloudflare-pages.md)

Last updated: 2026-03-12
[Back to Documentation Guide](../how-to-write-docs.md)
