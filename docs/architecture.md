# Architecture

## Overview

```txt
┌──────────────────────────────────────────────────────────────────┐
│ Browser: sample app (http://localhost:5173)                      │
│                                                                  │
│  Host React app (sample-library)                                 │
│   └─ DOM elements tagged by vite-plugin-component-tagger:        │
│        <section data-ref="src/components/BookCard.tsx#L12-14">   │
│                                                                  │
│  Feedback client (separate React root, data-feedback-ui)         │
│   pencil button - pick modes - markers - panel - export          │
└───────────────┬──────────────────────────────────────────────────┘
                │ fetch (CORS: *)
┌───────────────▼──────────────────────────────────────────────────┐
│ Backend: Hono on Node (http://localhost:4000)                    │
│   /api/projects/:projectKey/comments CRUD                        │
│   Drizzle ORM → SQLite file (apps/backend/data/feedback.db)      │
└──────────────────────────────────────────────────────────────────┘
```

## Build-time composition (the Vite plugin)

`@repo/vite-plugin-design-feedback` returns an array of sub-plugins:

1. **Guarded component tagger** (`enforce: 'pre'`)
   - The *real* `vite-plugin-component-tagger` npm package, instantiated with `extensions: ['.tsx', '.jsx']` (its default is Svelte) and `enableInProd: true` — the designFeedback `enabled` option is the single on/off switch, and built demos should be commentable too.
   - In its default `components` mode it adds `data-ref="<relative-path>#L<start>-<end>"` to the first lowercase root element of each component file.
   - The wrapper delegates `transform` to the tagger, then syntax-checks the result with esbuild (`loader: 'tsx'`). The tagger is regex-based; on TypeScript files it can corrupt code containing lowercase generics (`useState<boolean>`, `Record<string, T>`). If the check fails, the original code is returned untouched — that file's components simply aren't taggable and feedback falls back to coordinates.
   - Skips any module id containing `feedback-client` so the feedback UI is never instrumented.
   - Must run before `@vitejs/plugin-react` so it sees raw JSX and true source line numbers — hence `enforce: 'pre'` and the documented `plugins: [designFeedback(), react()]` ordering.

2. **Client injector**
   - `transformIndexHtml` adds:
     - an inline script: `window.__DESIGN_FEEDBACK_CONFIG__ = { projectKey, apiUrl }`
     - a `<script type="module">` loading the prebuilt client bundle.
   - In dev the bundle is served through a virtual module (`virtual:design-feedback-client`) that reads `@repo/feedback-client/bundle` from disk; the dev server watches the bundle file and triggers a full reload when it changes. In build the bundle is inlined.
   - When `enabled: false`, the plugin contributes nothing at all (no tagging, no UI).

React Fast Refresh keeps working because the tagger only adds a static string attribute to JSX before Babel sees it; the attribute is stable across edits unless line numbers shift, which at worst causes a normal HMR update.

## Runtime: the feedback client

A single self-contained IIFE bundle (React + ReactDOM included, ~production build) that mounts into its own `<div data-feedback-ui>` appended to `<body>`. It never touches the host app's React instance. All styling is injected at runtime under `dfb-*` class names.

State held in a small top-level React component tree:

- **identity** — `{ name, email }` from `localStorage["design-feedback:identity"]`; prompted on first interaction.
- **comments** — fetched per `projectKey` + `pagePath`; refetched on SPA navigation (history API patched to emit `design-feedback:navigation`).
- **mode** — `idle | pick-component | pick-position`; pick modes use a full-screen capture overlay; `Esc` cancels.
- **ui flags** — markers on/off, show-resolved, panel open.

### Anchoring (marker placement priority)

1. **Live component**: `document.querySelector('[data-ref="<componentTag>"]')`; if that misses (line numbers drift as files change), prefix match on the file-path part: `[data-ref^="src/components/BookCard.tsx#"]`. Marker is positioned against the element's bounding rect, recomputed on scroll/resize/DOM mutation.
2. **Coordinate fallback**: `normalizedX * innerWidth`, `normalizedY * innerHeight`.
3. **List only**: panel shows the comment flagged as missing-component. Never hidden.

### Coordinate capture

On every component/page-position creation click:

```ts
viewportWidth = window.innerWidth     viewportHeight = window.innerHeight
scrollX/scrollY = window.scrollX/Y    clientX/clientY = event.clientX/Y
pageX/pageY = event.pageX/Y
normalizedX = clientX / viewportWidth normalizedY = clientY / viewportHeight
```

## Data flow

- Create: client POSTs the full comment payload; server assigns `cmt_*` id, status `open`, timestamps; client appends to local state.
- Edit/resolve: PATCH `{ body?, status? }`; server bumps `updatedAt`.
- Delete: DELETE; client removes locally.
- No realtime: other reviewers' changes appear on next fetch (navigation/refresh).

## Monorepo wiring

- pnpm workspace; internal deps via `workspace:*`.
- `packages/feedback-client` builds first (Vite lib mode → `dist/feedback-client.iife.js`).
- `packages/vite-plugin-design-feedback` builds with tsc (ESM + d.ts); depends on `@repo/feedback-client` only to resolve the bundle path at serve time, and on `vite-plugin-component-tagger` as a hard runtime dependency.
- `apps/sample-library` depends on the plugin in `vite.config.ts`.
- `apps/backend` is independent (Hono/Drizzle/libsql); migrations committed, auto-applied at boot.
- Root `pnpm dev` = one-shot package build, then parallel: client watch-build, plugin watch-build, backend (tsx watch), sample app (vite).
