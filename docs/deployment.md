# Deployment




## Environments

| Environment | Trigger | Command | Database |
|:---|:---|:---|:---|
| **Staging** | Automatic (PR) | `npm run deploy:staging` | `entix-app-staging` |
| **Production** | Manual | `npm run deploy:production` | `entix-app-production` |

### Staging (Preview)
- **Trigger**: Automatic on every Pull Request via Cloudflare GitHub Integration
- **Environment**: Uses `staging` environment in `wrangler.jsonc`
- **Isolation**: Separate D1 databases, KV namespaces, and R2 buckets

### Production
- **Trigger**: Manual deployment
- **Command**: `npm run deploy:production`
- **Process**: Applies migrations → Builds frontend → Deploys Worker with assets

### Environment Configuration
Defined in `wrangler.jsonc`:

```jsonc
"env": {
  "development": { ... },  // Local development
  "staging": { ... },      // Preview deployments
  "production": { ... }    // Production deployments
}
```

### Cloudflare Credentials
**Not required** for local development or CI/CD. Wrangler handles authentication implicitly.
