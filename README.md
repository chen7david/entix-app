# Entix-App

A full-stack application built on **Cloudflare Workers** (API) + **Vite + React** (frontend).

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Setup & Run

```bash
# 1. Install dependencies
npm run dev:init

# 2. Start development servers (API + Frontend)
npm run dev

# 3. Initialize database (after hitting an API endpoint)
npm run db:migrate:development
```

- **Web**: [http://localhost:8000](http://localhost:8000)
- **API**: [http://localhost:3000](http://localhost:3000)
- **API Reference**: [http://localhost:3000/api/v1/api-reference](http://localhost:3000/api/v1/api-reference)

---

## Documentation

📚 **Full documentation is available via VuePress**:

- **Local**: Run `npm run dev:docs` then visit [http://localhost:5173/docs](http://localhost:5173/docs)
- **Production**: [https://entix.org/docs](https://entix.org/docs) (after deployment)

### Documentation Topics

**Getting Started**
| Topic | Description |
|-------|------------|
| [Setup & Development](docs/setup.md) | Installation, environment variables, development workflow, scripts reference |
| [Architecture](docs/architecture.md) | System architecture, project structure, 3-file routing pattern, middleware stack |

**Backend**
| Topic | Description |
|-------|------------|
| [Database](docs/database.md) | D1 setup, migrations, Better Auth integration, wrangler configuration |
| [Authentication](docs/authentication.md) | Better Auth configuration, features, and plugins |
| [API & Errors](docs/api.md) | OpenAPI/Scalar setup, CORS configuration, error handling, validation |
| [Middleware](docs/middleware.md) | CORS, logger, error handlers, execution order |

**Frontend**
| Topic | Description |
|-------|------------|
| [Frontend](docs/frontend.md) | React/Vite architecture, API integration, build process |

**Operations**
| Topic | Description |
|-------|------------|
| [Testing](docs/testing.md) | Vitest setup, test factories, writing tests, CI/CD |
| [Deployment](docs/deployment.md) | Staging/production deployment, build configuration, migrations |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and solutions |

---

## Tech Stack

**Backend**
- Cloudflare Workers (Edge runtime)
- Hono (Web framework)
- D1 Database (SQLite at the edge)
- Drizzle ORM
- Better Auth (Authentication)
- OpenAPI + Scalar (API documentation)

**Frontend**
- React 18
- Vite
- TypeScript
- React Router
- Jotai (State management)

**Development**
- Vitest (Testing with Workers pool)
- TypeScript
- Wrangler (Cloudflare CLI)
- VuePress (Documentation)

---

## Quick Links

- **OpenAPI JSON**: [/api/v1/openapi](http://localhost:3000/api/v1/openapi)
- **API Reference**: [/api/v1/api-reference](http://localhost:3000/api/v1/api-reference)
- **Documentation**: [/docs](http://localhost:5173/docs)
- **GitHub**: [chen7david/entix-app](https://github.com/chen7david/entix-app)

---

## License

MIT
