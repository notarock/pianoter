# Pianoter — Frontend

React + TypeScript frontend for Pianoter, built with Vite.

## Stack

- [React](https://react.dev) 19 with TypeScript
- [Vite](https://vitejs.dev) for building and dev server
- [Mantine](https://mantine.dev) for UI components
- [mantine-datatable](https://icflorescu.github.io/mantine-datatable/) for the sortable tables
- [react-router-dom](https://reactrouter.com) v7 for routing
- [i18next](https://www.i18next.com) + react-i18next for EN / FR translations

## Dev

```bash
npm install
npm run dev
```

Runs on port `5173`. API calls to `/api` get proxied to the backend at `localhost:8080`.

## Build

```bash
npm run build
```

Output goes to `dist/`. In Docker, Nginx serves the built assets and proxies API requests.

## Tests

```bash
npm test          # unit tests with vitest
npm run cy:run    # Cypress e2e headless
npm run cy:open   # Cypress e2e interactive
```

## Project structure

```
src/
  api/          # typed API client and request helpers
  context/      # AuthContext (JWT, user state)
  pages/        # one file per route (Dashboard, Repertoire, PieceDetail, …)
  locales/      # en.json and fr.json
  utils.ts      # shared helpers (date formatting, status colors, etc.)
  App.tsx        # router, nav shell, protected routes
  main.tsx       # entry point
```
