# **Entix-App – Project Overview**

Entix-App is a full-stack application built on **Cloudflare Workers** (API) and a **Vite + React** frontend (web).  
Though API and Web run as separate applications during development, **production deployment bundles both together** into a single Worker, which serves API endpoints and static assets from one place.

This document explains the project layout, how local development works, how shared packages are handled, and how deployment behaves.

---

## **Project Structure**

```
entix-app/
 ├── src/              # Worker API source code
 ├── web/              # Vite + React frontend
 ├── shared/           # Shared DTOs, schemas, utilities
 ├── wrangler.jsonc    # Cloudflare Worker config
 ├── package.json      # Root package manager config
 └── ...
```

### **Package Manager**
- The entire project uses **npm**.
- Installing root-level dependencies:  
  ```bash
  npm install
  ```
- Installing frontend dependencies:  
  ```bash
  cd web
  npm install
  ```

---

## **Shared Types & DTOs**

The `shared` directory contains code used by **both** the API and the Web.

Import shared items like this:

```ts
import { UserDTO } from "@shared";
```

Path aliases work because Vite and Wrangler both read the root `tsconfig` (extended in `web`), and `vite-tsconfig-paths` resolves them automatically.

No symlinks or publishing required — just import.

---

## **Local Development**

Local development intentionally runs **as two separate applications**:

### **1. API (Cloudflare Worker Local Mode)**
Runs on port **3000**:

```bash
wrangler dev --local --port 3000
```

### **2. Web (Vite Dev Server)**
Runs on port **8000**:

```bash
cd web && npm run dev
```

Using the root script:

```bash
npm run dev
```

`concurrently` launches both dev servers.  
You will see:

- API → `http://localhost:3000`
- Web → `http://localhost:8000`

---

## **Calling the API in Development**

The Vite dev server is configured to **proxy all `/api` traffic** to the local API Worker.

`web/vite.config.ts`:

```ts
server: {
  port: 8000,
  proxy: {
    "/api": {
      target: "http://localhost:3000",
      changeOrigin: true,
    },
  },
},
```

### **API calls in dev should NEVER include localhost or a URL.**

Correct usage:

```ts
const response = await axios.get<UserDTO>("/api/v1/users");
```

### **External APIs still require full URLs:**

```ts
await axios.get("https://example.com/weather");
```

---

## **Production Deployment**

In production, everything becomes **one single Cloudflare Worker**:

1. The frontend is built into `web/dist`
2. Wrangler deploys the Worker and serves static assets from the `dist` folder
3. API and Web are now combined into one unified deployment

The asset config in `wrangler.jsonc`:

```jsonc
"assets": {
  "binding": "ASSETS",
  "directory": "./web/dist"
}
```

### **Routing Notes**
- Production automatically resolves API routes correctly  
- No need to hardcode backend URLs  
- API and Web redeploy together as one unit

---

## **Deployment Command**

Deploying to Cloudflare Production:

```bash
npm run deploy
```

This performs:

1. `npm run build:web`
2. `wrangler deploy --minify --env prod`

---

## **Root Scripts (package.json)**

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:web\"",
    "dev:api": "wrangler dev --local --port 3000",
    "dev:web": "cd web && npm run dev",
    "build:web": "cd web && npm run build",
    "deploy": "npm run build:web && wrangler deploy --minify --env prod",
    "cf-typegen": "wrangler types --env-interface CloudflareBindings"
  }
}
```

---

## **Key Behaviors Summary**

### **Development**
- Two separate ports:
  - API → 3000  
  - Web → 8000  
- `/api` routes automatically forwarded to API  
- Shared DTO imports work with `@shared`  
- Vite handles backend routing in dev

### **Production**
- Built frontend is served by the Worker  
- API and Web deployed together  
- No separate servers  
- URLs resolved automatically by Cloudflare

---

## **Developer Notes**
- Install dependencies:
  - **Root/API/shared:** `npm install`
  - **Web-only:** `cd web && npm install`
- Never use full URLs for internal API calls  
- External calls must use full URLs  
- Any code change in API or Web redeploys the entire Worker
