# Backend API Reference

Base URL (dev): `http://localhost:4000`

- No authentication.
- CORS: all origins, headers, and methods are allowed.
- All bodies are JSON. All timestamps are ISO-8601 strings set by the server.
- Comment ids are server-generated and `cmt_`-prefixed.

## Comment object

```ts
type CommentType = "component" | "page-position" | "page-general";
type CommentStatus = "open" | "resolved";

type Comment = {
  id: string;                 // "cmt_..."
  projectKey: string;
  pagePath: string;           // e.g. "/books"
  url: string;                // full URL at creation time, for debugging
  type: CommentType;
  body: string;
  authorName: string;
  authorEmail: string;
  status: CommentStatus;      // default "open"

  // Component metadata (component comments only; null otherwise)
  componentName: string | null;     // e.g. "BookCard"
  componentTag: string | null;      // data-ref value, e.g. "src/components/BookCard.tsx#L12-14"
  componentMetadata: string | null; // JSON text for anything extra
  domPath: string | null;           // CSS-ish path captured at creation
  textSnippet: string | null;       // first ~120 chars of the element's text

  // Coordinates (component and page-position comments; null for page-general)
  viewportWidth: number | null;
  viewportHeight: number | null;
  scrollX: number | null;
  scrollY: number | null;
  clientX: number | null;
  clientY: number | null;
  pageX: number | null;
  pageY: number | null;
  normalizedX: number | null;  // clientX / viewportWidth
  normalizedY: number | null;  // clientY / viewportHeight

  createdAt: string;           // ISO-8601
  updatedAt: string;           // ISO-8601
};
```

There are no screenshot fields in phase 1; the schema can be extended later.

## Endpoints

### `GET /health`

```json
{ "ok": true }
```

### `GET /api/projects/:projectKey/pages`

Per-page comment counts for the project — powers the client's "All pages with comments" view.

Response `200`:

```json
{
  "pages": [
    {
      "pagePath": "/books",
      "total": 4,
      "open": 3,
      "resolved": 1,
      "lastUpdatedAt": "2026-06-09T15:30:00.000Z"
    }
  ]
}
```

Pages are ordered by `pagePath` ascending; pages with no comments are not listed.

### `GET /api/projects/:projectKey/comments`

Query parameters:

| param             | required | meaning                                              |
| ----------------- | -------- | ---------------------------------------------------- |
| `pagePath`        | yes*     | return only comments for this page path               |
| `includeAllPages` | no       | `true` returns every page's comments for the project (admin/future use); `pagePath` is then ignored |

\* required unless `includeAllPages=true`. Missing both → `400`.

Response `200`:

```json
{ "comments": [ { "id": "cmt_...", "...": "..." } ] }
```

Comments are ordered by `createdAt` ascending.

### `POST /api/projects/:projectKey/comments`

Create a comment. The `projectKey` comes from the URL; a `projectKey` in the body is ignored.

Required body fields: `pagePath`, `url`, `type`, `body`, `authorName`, `authorEmail`.
Optional: `status` (default `"open"`), all component metadata fields, all coordinate fields. Irrelevant fields for the comment type should simply be omitted (stored as `null`).

```bash
curl -X POST http://localhost:4000/api/projects/sample-library/comments \
  -H 'content-type: application/json' \
  -d '{
    "pagePath": "/books",
    "url": "http://localhost:5173/books",
    "type": "component",
    "body": "Make the due date more prominent.",
    "authorName": "Mike",
    "authorEmail": "mike@example.com",
    "componentName": "BookCard",
    "componentTag": "src/components/BookCard.tsx#L12-14",
    "viewportWidth": 1280, "viewportHeight": 1080,
    "scrollX": 0, "scrollY": 240,
    "clientX": 810, "clientY": 480,
    "pageX": 810, "pageY": 720,
    "normalizedX": 0.633, "normalizedY": 0.444
  }'
```

Response `201`: the full created `Comment`.
Response `400`: `{ "error": "..." }` on validation failure.

### `PATCH /api/projects/:projectKey/comments/:commentId`

Update a comment. Accepted fields (all optional, at least one required):

```json
{ "body": "new text", "status": "resolved" }
```

`status` must be `"open"` or `"resolved"`. `updatedAt` is bumped server-side.

Response `200`: the full updated `Comment`. `404` if not found under that project.

### `DELETE /api/projects/:projectKey/comments/:commentId`

Response `200`: `{ "ok": true }`. `404` if not found under that project.

## Database

SQLite file: `apps/backend/data/feedback.db` (gitignored, auto-created).
Schema: `apps/backend/src/schema.ts` (Drizzle ORM, table `comments`).
Migrations: `apps/backend/drizzle/`, generated with `pnpm db:generate`, applied with `pnpm db:migrate` — and auto-applied when the backend boots.
