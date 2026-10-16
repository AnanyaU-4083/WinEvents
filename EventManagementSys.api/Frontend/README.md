# WinEvents Frontend

React, TypeScript, Vite, and Tailwind CSS frontend for the WinEvents event management application.

## Requirements

- Node.js 22 (see `.nvmrc`)
- npm

## Setup and commands

Run these commands from the `Frontend` directory:

```powershell
npm install
npm run dev
```

Project checks:

```powershell
npm test
npm run test:coverage
npm run lint
npm run typecheck
npm run format:check
npm run build
```

Vitest and V8 collect coverage. The minimum is 80% for both line and branch coverage.

## Configuration

The development server proxies `/api` to `http://localhost:5244`. Set `VITE_API_BASE_URL` in a local `.env` file only when the frontend should call a different API origin. `.env.example` documents the optional setting. Do not commit secrets.

## Source layout

- `src/Pages`: route-level screens
- `src/Components`: reusable UI components
- `src/auth`: Microsoft authentication setup
- `src/config`: validated environment configuration
- `src/shared/api`: shared API request helper
- `tests`: Vitest and React Testing Library unit tests, MSW setup, and test utilities

TypeScript is strict. Use the shared API client, reusable components, semantic HTML, and Tailwind utility classes. Keep tests in `tests` rather than beside production components.
