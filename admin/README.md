# Timer App Yoga — Admin

Internal admin tools for managing Timer App Yoga content. Built with Create React App + TypeScript + Redux Toolkit, served by the Express API server in production.

## Dev setup

You need the API server running first so the admin can proxy requests to it.

```bash
# Terminal 1 — API server (port 3001)
cd ../server && npm run dev

# Terminal 2 — Admin UI (port 3000, hot reload)
npm start
```

The header shows a live **API ✓ / API ✗** indicator. If it shows ✗, make sure the server is running on port 3001.

## Available scripts

| Command | Description |
|---|---|
| `npm start` | Dev server at localhost:3000 with hot reload |
| `npm run build` | Production build to `build/` |
| `npm test` | Jest test runner |
| `npm run test:coverage` | Jest with coverage report |

## Project structure

```
admin/
  src/
    App.tsx          — App shell (header, nav, page routing)
    App.css          — Admin styles
    api/             — API client functions (add here as needed)
    hooks/
      useFetch.ts    — Generic fetch hook with loading/error state
      useDebounce.ts — Generic debounce hook
    store/
      store.ts       — Redux Toolkit store (add slices as needed)
  public/
    index.html       — HTML entry point
```

## Adding a new tool / page

1. Create a component in `src/pages/YourTool.tsx`
2. Add an entry to the `TABS` array in `App.tsx`
3. Add the render case in the `<main>` block

## Production

In production the admin is served by the Express server at `/admin`.

```bash
# Build the admin
npm run build

# The Express server picks it up automatically at http://localhost:3001/admin
```

## Tools

| Tool | Status | Description |
|---|---|---|
| Flow Editor | Planned | Create and edit yoga flow JSON — port of `assets/data/yoga-flow-editor.html` |
