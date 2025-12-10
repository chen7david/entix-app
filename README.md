# **Entix-App – Project Overview**

Entix-App is a full-stack application built on **Cloudflare Workers** (API) and a **Vite + React** frontend (web).  
Though API and Web run as separate applications during development, **production deployment bundles both together** into a single Worker, which serves API endpoints and static assets from one place.

This document explains the project layout, how local development works, how shared packages are handled, how deployments work, and how staging vs production environments behave.

---

## **Project Structure**

entix-app/
 ├── src/              # Worker API source code
 ├── web/              # Vite + React frontend
 ├── shared/           # Shared DTOs, schemas, utilities
 ├── wrangler.jsonc    # Cloudflare Worker config
 ├── package.json      # Root package manager config
 └── ...

### **Package Manager**
- The entire project uses **npm**.
- Installing root-level dependencies:  
  npm install
- Installing frontend dependencies:  
  cd web && npm install

---

## **Shared Types & DTOs**

The `shared` directory contains code used by **both** the API and the Web.

Import shared items like this:

import { UserDTO } from "@shared";

Path aliases work because Vite and Wrangler both read the root `tsconfig`, and `vite-tsconfig-paths` resolves them automatically.

No symlinks or publishing required — just import.

---

## **Local Development**

Local development intentionally runs **as two separate applications**:

### **1. API (Cloudflare Worker Local Mode)**  
Runs on port **3000**:

wrangler dev --local --port 3000

### **2. Web (Vite Dev Server)**  
Runs on port **8000**:

cd web && npm run dev

Using the root script:

npm run dev

This launches both API and Web concurrently.

---

## **Calling the API in Development**

Vite proxies all `/api` calls to the local Worker API.

Correct API usage in development:

const response = await axios.get<UserDTO>("/api/v1/users");

Do **not** hardcode localhost URLs.

External APIs still require full URLs:

await axios.get("https://example.com/weather");

---

## **Deployments**

Entix-App uses **Cloudflare GitHub Integration** to automate deployments for **staging** and uses manual commands for **production**.

### **Staging (Preview Deployments)**  
Whenever you create a **Pull Request**, Cloudflare automatically:

- Builds the feature branch  
- Deploys it as a **preview Worker environment**  
- Posts a **Preview URL** in the PR comments  
- We treat this preview as our **staging deployment**

This preview behaves exactly like production, with:

- Static assets  
- API routes  
- Environment bindings  
- Worker logic  

### **Environment Separation**

We have **two isolated Cloudflare environments**:

#### **1. staging**
Created automatically with each PR.  
Has its own:

- D1 Database  
- R2 bucket(s)  
- KV namespaces  
- Queues  
- Environment variables  

#### **2. prod**
The live production environment.  
Also has its **own** bindings separate from staging.

Cloudflare selects the correct environment using:

--env staging  
--env prod

### **Production Deployment**

Executed manually:

npm run deploy

This performs:

1. Build the frontend → `web/dist`
2. Deploy entire Worker + static assets to **prod**

---

## **Production Behavior**

In production:

- API and Web run in **one Cloudflare Worker**
- All static assets come from `web/dist`
- No separate servers  
- Routing is automatic  
- No hardcoded backend URLs needed  

Asset config in `wrangler.jsonc`:

"assets": {
  "binding": "ASSETS",
  "directory": "./web/dist"
}

---

## **Root Scripts (package.json)**

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

---

## **Key Behaviors Summary**

### **Development**
- API → port 3000  
- Web → port 8000  
- Vite proxies `/api` → API Worker  
- Shared DTO imports via `@shared`  
- Never hardcode URLs

### **Staging**
- Auto-deployed for every Pull Request  
- Preview URL is posted automatically  
- Fully isolated Cloudflare environment  
- Separate: D1, R2, KV, Queues, ENV vars

### **Production**
- Single Worker hosts **both** API + Web  
- Deploy with: `npm run deploy`  
- Separate D1 / KV / R2 / Queues from staging  

---

## **Developer Notes**
- Install dependencies:
  - Root/API/shared → `npm install`
  - Web → `cd web && npm install`
- Internal API calls must always be relative  
- External APIs require full URLs  
- All code changes in Web or API redeploy the Worker  
- PR previews = staging; manual deploy = production
