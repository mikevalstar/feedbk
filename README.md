# Design Feedback Tool

A pnpm monorepo containing a Vite plugin + injected UI for collecting design feedback on a running app, and exporting that feedback in a format an AI coding agent can act on.

Reviewers open the app being reviewed, click a floating pencil button in the bottom-right corner, and can:

- attach a comment to a specific tagged component,
- attach a comment to a clicked position on the page,
- leave a general comment about the page,
- view, resolve, edit and delete comments left by others,
- copy all of the current page's feedback to the clipboard as a structured prompt for an AI coding agent.

This is an internal demo/design-review tool. There is intentionally **no** authentication, authorization, tenancy, billing, or production hardening. There is **no screenshot functionality** in phase 1 (the schema leaves room for it later).

## Monorepo layout

```txt
packages/
  vite-plugin-design-feedback/   Vite plugin: composes vite-plugin-component-tagger + injects the feedback UI
  feedback-client/               The injected browser UI (React, built as a single self-contained bundle)
apps/
  backend/                       Hono + Drizzle + SQLite API that stores comments
  sample-library/                Vite React sample app (a small library website) used to test feedback
docs/                            API reference, usage guide, architecture notes
README.md
CLAUDE.md
```

## Requirements

- Node.js >= 20
- pnpm >= 9

## Install

```bash
pnpm install
```

## Database setup

The backend uses a local SQLite file at `apps/backend/data/feedback.db` (created automatically). Migrations are committed to the repo and are also applied automatically when the backend starts, so this step is optional:

```bash
pnpm db:migrate    # apply migrations explicitly
pnpm db:generate   # regenerate migrations after editing the Drizzle schema
```

## Development

```bash
pnpm dev
```

This builds the workspace packages once, then runs in parallel:

- `apps/backend` — API on http://localhost:4000
- `apps/sample-library` — Vite dev server on http://localhost:5173
- `packages/feedback-client` — rebuilds the injected UI bundle on change
- `packages/vite-plugin-design-feedback` — rebuilds the plugin on change

Open http://localhost:5173 and click the pencil button in the bottom-right corner.

Other root scripts:

```bash
pnpm build       # build all packages and apps
pnpm typecheck   # TypeScript checks across the workspace
```

## Plugin configuration

```ts
// vite.config.ts of the app under review
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import designFeedback from "@repo/vite-plugin-design-feedback";

export default defineConfig({
  plugins: [
    designFeedback({
      projectKey: "sample-library",      // scopes comments to this project
      apiUrl: "http://localhost:4000",   // the feedback backend
      enabled: true,                     // when false, nothing is tagged or injected
    }),
    react(),
  ],
});
```

Place `designFeedback()` **before** `react()` so the component tagger sees original JSX source (and source line numbers) before any React transform runs.

Options:

```ts
type DesignFeedbackPluginOptions = {
  projectKey: string;
  apiUrl: string;
  enabled?: boolean; // default true
};
```

What the plugin does:

1. Runs the real [`vite-plugin-component-tagger`](https://www.npmjs.com/package/vite-plugin-component-tagger) over `.tsx`/`.jsx` files, which stamps each component's root element with `data-ref="src/components/BookCard.tsx#L12-14"`. A thin guard wraps the tagger: its output is syntax-checked with esbuild and dropped for any file it would corrupt (it is regex-based and can trip on TypeScript generics), so the app never breaks — that file simply falls back to coordinate-based feedback.
2. Injects the prebuilt feedback UI bundle (`@repo/feedback-client`) into `index.html`, along with `window.__DESIGN_FEEDBACK_CONFIG__ = { projectKey, apiUrl }`.
3. Never tags or instruments the feedback client itself — the client ships as a prebuilt bundle served from a virtual module, outside the tagger's reach.

## How page scoping works

Every comment is stored with a `projectKey` and a `pagePath` (`window.location.pathname` at creation time, full URL stored alongside for debugging). The injected UI only requests comments for the current project + path, so a comment created on `/books` does not appear on `/checkout`. SPA navigations (pushState/popstate) are detected and the comment set is re-fetched. The API supports `includeAllPages=true` for future admin use.

## How component comments work

1. Click the pencil → "Add component comment".
2. Hover highlights any element carrying a `data-ref` attribute (emitted by `vite-plugin-component-tagger`).
3. Click a component → comment form opens.
4. Stored with the comment: the `data-ref` value (component tag), the component name derived from its file path, a DOM path, a text snippet, plus full coordinate data (viewport, scroll, client/page coordinates, normalized coordinates).

When rendering markers, the client tries in order:

1. Exact `data-ref` match in the current DOM (then a path-only prefix match, since line numbers in `data-ref` drift as files are edited) → marker anchors to the live component.
2. Normalized viewport coordinates → marker placed at the stored relative position.
3. Neither → the comment still appears in the page comments panel, flagged as
   `Component not currently found on this page. Originally attached to: BookCard.`

Comments are never hidden just because their component disappeared; missing-component comments remain viewable, editable, resolvable and deletable.

## How page comments work

- **Page-position comments**: click the pencil → "Add page-position comment" → click anywhere on the page. Coordinates are captured exactly like component comments, but no component metadata is stored.
- **General page comments**: click the pencil → "Add general page comment" → the form opens immediately. No component, no coordinates — the comment attaches to the page as a whole.

## How the AI-agent feedback export works

"Copy Feedback for AI Agent" (in the pencil menu and the comments panel) builds a structured Markdown/text block containing an instruction preamble, project/page/URL/timestamp, open/resolved counts, and all of the current page's comments grouped into: general page comments, page-position comments, component comments whose components are currently found, and component comments whose components are missing. It is copied to the clipboard (with a manual-copy modal fallback if the clipboard API fails) and is designed to be pasted directly into an AI coding agent. See [docs/export-format.md](docs/export-format.md) for the exact format. A "Download Feedback" action saves the same text as a `.md` file.

## API endpoints

Backend base URL: `http://localhost:4000`. CORS is fully permissive.

```txt
GET    /health
GET    /api/projects/:projectKey/comments?pagePath=/some/path
GET    /api/projects/:projectKey/comments?includeAllPages=true
POST   /api/projects/:projectKey/comments
PATCH  /api/projects/:projectKey/comments/:commentId
DELETE /api/projects/:projectKey/comments/:commentId
```

Full request/response shapes: [docs/api.md](docs/api.md).

## Known limitations

- `vite-plugin-component-tagger` is line/regex based and Svelte-first. In `components` mode it tags only the *root* element of each component file, and only when that root element's opening tag is on its own line. Files where its transform would produce invalid syntax (e.g. lowercase TypeScript generics like `useState<boolean>` appearing before the JSX) are skipped by the guard and fall back to coordinate-based feedback.
- `data-ref` line numbers drift as files are edited; matching falls back to a file-path prefix match.
- Coordinate fallback is normalized to the viewport, not the document — markers for scrolled/responsive layouts are approximate.
- `pagePath` is the raw `location.pathname`; query strings and hashes are ignored for scoping.
- No realtime sync — other reviewers' new comments appear on refresh/navigation, not live.
- No authentication; identity is self-reported name/email kept in `localStorage`.
- No screenshots in phase 1.

## Future improvements

- Screenshot capture and display (schema already tolerates extension).
- Element-level tagging (`tagType: "elements"`) for finer-grained anchoring.
- Realtime updates (SSE/WebSocket), comment threads/replies, admin dashboard across pages (`includeAllPages=true` is already supported by the API).
- Sturdier anchoring: persisted DOM paths + text snippets are already stored and could drive fuzzy re-anchoring.
