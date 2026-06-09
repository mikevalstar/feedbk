# CLAUDE.md

Guidance for coding agents working in this repository.

## What this is

A pnpm monorepo for an internal design-feedback tool: a Vite plugin injects a review UI into a host app; reviewers attach comments to tagged components, page positions, or whole pages; comments are stored in SQLite via a small Hono API; feedback can be exported as a structured prompt for an AI coding agent. No auth, no screenshots (phase 1), no production hardening — keep it that way unless asked.

## Architecture

```txt
apps/sample-library  ──(vite.config.ts uses)──>  packages/vite-plugin-design-feedback
                                                   ├─ composes the REAL vite-plugin-component-tagger (npm dep)
                                                   └─ injects the prebuilt bundle from packages/feedback-client
packages/feedback-client  ──(fetch)──>  apps/backend (Hono + Drizzle + SQLite)
```

- **packages/vite-plugin-design-feedback** — Node-side Vite plugin. Returns an array of sub-plugins: (1) a guarded wrapper around `vite-plugin-component-tagger` configured for `.tsx`/`.jsx`, (2) an injector that adds `window.__DESIGN_FEEDBACK_CONFIG__` plus a `<script>` for the client bundle via `transformIndexHtml`, serving the bundle through a virtual module in dev and inlining it at build.
- **packages/feedback-client** — the injected browser UI. React + TypeScript, built by Vite in lib mode into a single self-contained IIFE (`dist/feedback-client.iife.js`, exported as `@repo/feedback-client/bundle`) with React bundled in and CSS injected at runtime from a TS string. It renders into its own root div marked `data-feedback-ui` and never interferes with the host app's React instance.
- **apps/backend** — Hono on `@hono/node-server`, Drizzle ORM over `@libsql/client` (SQLite file at `apps/backend/data/feedback.db`), permissive CORS. Migrations live in `apps/backend/drizzle/` and auto-apply on boot.
- **apps/sample-library** — Vite React sample app (library theme, routes `/books` and `/checkout`) used to exercise every feedback flow, including a toggleable section for testing disappeared components.

## Commands

```bash
pnpm install
pnpm dev          # build packages once, then backend + sample app + package watchers in parallel
pnpm build        # build everything
pnpm typecheck    # tsc across the workspace
pnpm lint         # biome check (format + lint), config in biome.json
pnpm lint:fix     # biome check --write
pnpm db:generate  # drizzle-kit generate (after schema changes) — run in apps/backend via filter
pnpm db:migrate   # drizzle-kit migrate
```

Backend: http://localhost:4000 - Sample app: http://localhost:5173

## How vite-plugin-component-tagger is used

This is a hard requirement: the real npm package `vite-plugin-component-tagger` does the tagging. Do not replace it with a homegrown imitation.

- It is instantiated in `packages/vite-plugin-design-feedback/src/index.ts` with `extensions: ['.tsx', '.jsx']` and default `tagType: 'components'`.
- It emits `data-ref="<relative path>#L<start>-<end>"` on the first lowercase root element of each component file. That attribute is the anchor for everything: the client selects pick-able components via `[data-ref]`, stores the value as `componentTag`, and derives `componentName` from the path's basename.
- The wrapper around it exists for two reasons only: (1) it sets `enforce: 'pre'` so the tagger sees raw JSX before `@vitejs/plugin-react`, and (2) it syntax-checks the tagger's output with esbuild and returns the original code if the transform corrupted the file (the tagger is regex-based and can mangle lowercase TS generics such as `useState<boolean>` or `Record<string, T>`). When adding code to the sample app, prefer inferred generics (`useState(false)`) or uppercase type arguments so the root elements actually get tagged.
- The feedback client itself must never be tagged: it is a prebuilt bundle served via a virtual module, and the wrapper additionally skips any module id containing `feedback-client`.

## Where things live

- **DB schema**: `apps/backend/src/schema.ts` (Drizzle). Migrations in `apps/backend/drizzle/`.
- **API routes**: `apps/backend/src/index.ts`. Validation: `apps/backend/src/validation.ts` (zod).
- **Shared comment/API types (client side)**: `packages/feedback-client/src/types.ts`. The backend's types come from the Drizzle schema; the two are kept in sync by hand — if you change one, change the other and the docs.
- **Client API calls**: `packages/feedback-client/src/api.ts`.
- **Anchoring / component matching**: `packages/feedback-client/src/anchoring.ts`.
- **Coordinate capture**: `packages/feedback-client/src/coords.ts`.
- **AI export format**: `packages/feedback-client/src/exportText.ts` (documented in `docs/export-format.md`).
- **Plugin**: `packages/vite-plugin-design-feedback/src/index.ts`.
- **Docs**: `docs/` — keep `docs/api.md` in sync with backend routes and `docs/export-format.md` in sync with `exportText.ts`.

## How the client talks to the backend

The plugin injects `window.__DESIGN_FEEDBACK_CONFIG__ = { projectKey, apiUrl }`. The client reads it at mount and calls:

- `GET {apiUrl}/api/projects/{projectKey}/comments?pagePath={location.pathname}` on mount and on SPA navigation (history pushState/replaceState are patched to emit an event).
- `POST` to create, `PATCH` to edit body/status, `DELETE` to remove.

All comments are scoped by `projectKey` + `pagePath`. The UI never requests other pages' comments (the API's `includeAllPages=true` exists for future admin use only).

## Modifying tagging / anchoring safely

Marker rendering priority (implemented in `anchoring.ts`, do not reorder casually):

1. Live DOM element whose `data-ref` exactly equals the stored `componentTag`; failing that, an element whose `data-ref` starts with the same file path (line numbers drift as files are edited).
2. Normalized viewport coordinates (`normalizedX/Y` × current viewport).
3. No marker — but the comment must still be listed in the panel as missing
   ("Component not currently found on this page. Originally attached to: X").

Rules: never hide a comment because its anchor is gone; never store DOM positions server-side (they are computed at render time); keep all coordinate fields nullable (general page comments have none). If you change the `data-ref` format assumptions, update `anchoring.ts`, `exportText.ts`, `docs/export-format.md`, and the README together.

## Conventions

- TypeScript strict everywhere; ESM everywhere (`"type": "module"`).
- Formatting and linting via Biome (`biome.json` at the root: 120-col, double quotes, organized imports). Run `pnpm lint:fix` before committing; `noAutofocus` is off (modal UX is intentional) and backdrop click-to-close divs carry local `biome-ignore` comments.
- Workspace packages are `@repo/*` and linked with `workspace:*`.
- The feedback client's DOM uses `dfb-`-prefixed class names and lives under a root with `data-feedback-ui`; the picker ignores anything inside `[data-feedback-ui]`. Keep it that way so the tool can't comment on itself.
- Comment ids are `cmt_`-prefixed, generated server-side.
- Timestamps are ISO-8601 strings, set server-side.
- No new heavyweight deps without need; this is a prototype that values being understandable.

## Testing the sample app

There are no automated tests; verify manually:

1. `pnpm dev`, open http://localhost:5173.
2. First pencil click prompts for name/email → stored under `localStorage["design-feedback:identity"]`.
3. Create one comment of each type on `/books`; refresh — all three persist (SQLite via backend).
4. Navigate to `/checkout` — `/books` comments must not appear; create a comment there, go back, confirm scoping both ways.
5. On `/books`, toggle "Show overdue notices" off after commenting on that section — the comment must remain in the panel, flagged as missing, and still be resolvable/editable/deletable.
6. "Copy Feedback for AI Agent" — verify the export contains all four groups and the preamble; with clipboard blocked the manual-copy modal must appear.
7. `curl http://localhost:4000/health` and check CRUD via `docs/api.md` examples if the UI misbehaves.
