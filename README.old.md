# Entix-App

Entix-App is a full-stack application built on Cloudflare Workers (API) and a Vite + React frontend. This README is organized to give you a no-nonsense guide to running, developing, and deploying the app.

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Routing and Validation Rules](#routing-and-validation-rules)
6. [Error Handling](#error-handling)
7. [Deployment](#deployment)
8. [Scripts Reference](#scripts-reference)
9. [API Documentation](#api-documentation)

---

## Overview

This project is a full-stack web application where the backend API is hosted on Cloudflare Workers, and the frontend is built with Vite and React. In development, we run separate servers for the frontend and API. In production, both are bundled into a single Cloudflare Worker that handles everything.

## Quick Start

### Setup
To get started, install all dependencies for both the root and the web project:

```bash
npm run dev:init

