Prompt: 

Build a working pnpm monorepo for a Vite-based design feedback tool.

The goal is to let users reviewing a demo/design click a floating pencil button, add feedback to specific components or to the current page generally, view feedback from others, and copy all page feedback into a format suitable for an AI coding agent.

This is for internal demo/design review. It does not need strong security, authentication, authorization, tenancy, billing, or production hardening.

## Core requirements

Build a pnpm workspace monorepo with:

```txt
packages/
  vite-plugin-design-feedback/
  feedback-client/
apps/
  backend/
  sample-library/
README.md
CLAUDE.md
```

Use TypeScript everywhere.

The root `pnpm dev` command should run both the backend and sample app.

The root should include scripts for:

```txt
pnpm dev
pnpm build
pnpm typecheck
pnpm db:generate
pnpm db:migrate
```

Add linting if reasonable, but prioritize a working prototype.

## Important dependency requirement

The Vite plugin must actually use `vite-plugin-component-tagger` as part of the build.

Do not merely imitate the idea. Add `vite-plugin-component-tagger` as a real dependency and compose/wrap/configure it inside this project’s plugin. The sample app must use the real component tagger in the Vite plugin chain.

The feedback tool should rely on the metadata attributes emitted by `vite-plugin-component-tagger` wherever possible.

If extra metadata is needed, add a thin wrapper around `vite-plugin-component-tagger`, but keep `vite-plugin-component-tagger` as a real part of the implementation.

## No screenshots in phase 1

Do not implement screenshot capture, screenshot upload, screenshot display, or screenshot storage.

The schema can leave room for this in the future, but phase 1 should have no screenshot functionality.

## Package: `packages/vite-plugin-design-feedback`

Create a Vite plugin package.

It should expose a default plugin function like:

```ts
import designFeedback from "@repo/vite-plugin-design-feedback";

export default defineConfig({
  plugins: [
    react(),
    designFeedback({
      projectKey: "sample-library",
      apiUrl: "http://localhost:4000",
      enabled: true
    })
  ]
});
```

Plugin config options:

```ts
type DesignFeedbackPluginOptions = {
  projectKey: string;
  apiUrl: string;
  enabled?: boolean;
};
```

The plugin should:

* compose with `vite-plugin-component-tagger`
* inject the feedback client UI into the Vite app
* pass `projectKey` and `apiUrl` to the client
* only inject the feedback UI when enabled
* avoid tagging/instrumenting the feedback client itself
* work in a Vite React app
* preserve normal Vite dev behavior and React Fast Refresh as much as possible

## Package: `packages/feedback-client`

Create the injected browser UI.

Use React + TypeScript.

The client should render a floating pencil button in the bottom-right corner.

On first interaction, prompt the reviewer for:

* name
* email

Store this identity in `localStorage`.

The pencil menu should allow:

* add component comment
* add page-position comment
* add general page comment
* view comments for this page
* toggle markers
* show/hide resolved comments
* copy/download feedback for AI agent

## Comment types

Support three comment types:

```ts
"component"
"page-position"
"page-general"
```

### Component comments

A component comment is attached to a tagged component/element.

Flow:

1. User clicks pencil.
2. User chooses “Add component comment.”
3. Page enters component-comment mode.
4. Hovered tagged components are highlighted.
5. User clicks a component.
6. Comment form opens.
7. Store component metadata, page scope, and coordinate fallback data.

For component comments, store:

* project key
* current page path
* full URL
* comment body
* author name/email
* status
* component name
* component tag/id/metadata from `vite-plugin-component-tagger`
* viewport data
* click coordinates
* normalized coordinates
* timestamps

### Page-position comments

A page-position comment is attached to a clicked location on the current page, not to a component.

Flow:

1. User clicks pencil.
2. User chooses “Add page-position comment.”
3. User clicks anywhere on the page.
4. Comment form opens.
5. Store page scope and coordinate data, but no component metadata.

### General page comments

A general page comment is attached to the current page as a whole.

Flow:

1. User clicks pencil.
2. User chooses “Add general page comment.”
3. Comment form opens immediately.
4. Store page scope and comment body.
5. Do not require component selection or page click.

General page comments may have no coordinates and no component metadata.

## Page scoping

All comments must be scoped by:

* `projectKey`
* `pagePath`

Use `window.location.pathname` as `pagePath` in phase 1.

Also store the full URL for debugging.

Default UI behavior must only show comments for the current page.

A comment created on `/books` should not show on `/checkout` by default.

## Component disappeared behavior

If a component comment was attached to a component that later disappears, the comment must not disappear.

When rendering comments:

1. Try to find the current DOM element using stored component metadata.
2. If found, render the marker near the component.
3. If not found, try coordinate fallback.
4. If coordinate fallback is unreliable, show the comment in the page comment list as an unanchored/missing-component comment.

The UI should clearly indicate:

```txt
Component not currently found on this page. Originally attached to: BookCard.
```

Missing-component comments must remain visible, editable, resolvable, and deletable.

Never hide comments just because the original component cannot be found.

## Coordinate capture

When creating a component or page-position comment, capture:

```ts
viewportWidth
viewportHeight
scrollX
scrollY
clientX
clientY
pageX
pageY
normalizedX = clientX / viewportWidth
normalizedY = clientY / viewportHeight
```

Use coordinates as fallback for displaying markers when the component cannot be found.

Marker rendering priority:

1. Current DOM position of matched component
2. Normalized viewport coordinate fallback
3. Page comment list only

## Comment markers and list

Show small markers/pins for visible comments.

The current page comments panel should show:

* general page comments
* page-position comments
* component comments whose component is currently found
* component comments whose component is currently missing

Allow comments to be marked:

```txt
open
resolved
```

Allow resolved comments to be shown/hidden.

Allow comments to be deleted.

## Copy/download feedback for AI agent

Add a button in the menu or comments panel:

```txt
Copy Feedback for AI Agent
```

It may also be labelled:

```txt
Download Feedback
```

For phase 1, this should copy a large structured text block to the clipboard. It does not need to create an actual file unless easy.

The copied text should include all feedback for the current page by default.

It should be suitable to paste directly into an AI coding agent.

Include:

* project key
* page path
* full URL
* export timestamp
* total comment count
* open comment count
* resolved comment count
* grouped comments:

  * general page comments
  * page-position comments
  * component comments with currently found components
  * component comments whose components are currently missing

For each comment include:

* comment id
* status
* author name/email
* created/updated timestamps
* body
* component name if available
* component tag/id if available
* current component-found status
* page path
* coordinates if available
* normalized coordinates if available

The copied text should begin with an instruction block like:

```txt
# Design Feedback Export

You are a coding agent working on this application.

Apply the following design-review feedback for the page below.

Use component names, component metadata, and coordinates as hints. If a referenced component no longer exists, infer the most likely current component or page area from the comment text and page context. Do not remove unrelated functionality. Make focused changes that address the feedback.

Project: sample-library
Page: /books
URL: http://localhost:5173/books
Exported: 2026-06-09T15:30:00.000Z
```

Then include grouped comments in readable Markdown/text.

Example structure:

```txt
Summary:
- Total comments: 5
- Open comments: 4
- Resolved comments: 1

## General Page Comments

### Comment cmt_123
Status: open
Author: Mike <mike@example.com>
Created: 2026-06-09T15:20:00.000Z

Feedback:
The page feels too busy. Reduce visual noise and make the primary checkout flow clearer.

## Page-Position Comments

### Comment cmt_456
Status: open
Author: Jane <jane@example.com>
Position:
- clientX/clientY: 420, 260
- normalizedX/normalizedY: 0.328, 0.241

Feedback:
This area needs a stronger empty state when no search results are found.

## Component Comments - Found

### Comment cmt_789
Status: open
Author: Mike <mike@example.com>
Component: BookCard
Component Tag: src/components/BookCard.tsx:BookCard
Position:
- clientX/clientY: 810, 480
- normalizedX/normalizedY: 0.633, 0.444

Feedback:
Make the due date more prominent and add a visual warning when the book is overdue.

## Component Comments - Missing

### Comment cmt_999
Status: open
Author: Sarah <sarah@example.com>
Original Component: CheckoutPanel
Component Tag: src/components/CheckoutPanel.tsx:CheckoutPanel

Note:
The original component was not found on the page when this export was generated.

Feedback:
The checkout confirmation button should be more obvious.
```

After copying, show:

```txt
Feedback copied to clipboard.
```

If clipboard copy fails, show the text in a modal or textarea so the user can manually copy it.

## App: `apps/backend`

Create a TypeScript backend.

Use:

* Node.js
* Hono or Fastify, prefer Hono if simpler
* Drizzle ORM
* SQLite
* local SQLite database file
* permissive CORS allowing all origins, headers, and methods

No authentication required.

API endpoints:

```txt
GET    /health
GET    /api/projects/:projectKey/comments?pagePath=/some/path
POST   /api/projects/:projectKey/comments
PATCH  /api/projects/:projectKey/comments/:commentId
DELETE /api/projects/:projectKey/comments/:commentId
```

The default `GET` endpoint should return comments for the requested `projectKey` and `pagePath`.

Optionally support:

```txt
includeAllPages=true
```

for future/admin use, but the injected UI should request current-page comments by default.

Suggested comments table fields:

```ts
id
projectKey
pagePath
url
type // "component" | "page-position" | "page-general"
body
authorName
authorEmail
componentName
componentTag
componentMetadata // JSON text if useful
domPath
textSnippet
viewportWidth
viewportHeight
scrollX
scrollY
clientX
clientY
pageX
pageY
normalizedX
normalizedY
status // "open" | "resolved"
createdAt
updatedAt
```

## App: `apps/sample-library`

Create a Vite React sample app that uses the feedback plugin.

It should have no real backend for library behavior. It is just a realistic UI for testing feedback.

Theme: a small library website for checking books in and out.

Include componentized sections such as:

* header/nav
* book search
* book cards
* checkout panel
* member card
* recent activity
* overdue notices
* stats/dashboard cards
* at least two routes/pages, such as `/books` and `/checkout`, so page-scoping can be tested

Configure the plugin like:

```ts
designFeedback({
  projectKey: "sample-library",
  apiUrl: "http://localhost:4000",
  enabled: true
})
```

The sample app should make it easy to test:

* component comments
* page-position comments
* general page comments
* comments scoped to different routes
* hidden/missing components

Include at least one toggle or conditional UI section so we can test a component disappearing while its comments remain visible in the list.

## Documentation

Generate a root `README.md` explaining:

* what this project does
* monorepo layout
* install steps
* dev steps
* plugin configuration
* API endpoints
* database setup
* how page scoping works
* how component comments work
* how page comments work
* how the AI-agent feedback export works
* known limitations
* future improvements

Generate a root `CLAUDE.md` explaining to future coding agents:

* project architecture
* package responsibilities
* important commands
* coding conventions
* how `vite-plugin-component-tagger` is used
* how the feedback client talks to the backend
* where schema/API/client types live
* how to safely modify tagging/comment anchoring logic
* how to test the sample app

Additionally, generate a `docs/` folder with API documentation, usage guides, and other project documentation. Keep this up to date as you build. Write the documentation first before doing any work. 

## Acceptance criteria

The implementation is complete when:

* `pnpm install` succeeds
* `pnpm dev` starts backend and sample app together
* sample app opens and shows a library UI
* sample app uses the real `vite-plugin-component-tagger` dependency in the Vite plugin chain
* floating pencil button appears bottom-right
* first use prompts for name/email and saves identity to `localStorage`
* user can create a component comment
* user can create a page-position comment
* user can create a general page comment without selecting a component or coordinate
* comments are stored in SQLite via the backend
* comments reload after page refresh
* comments are scoped by `projectKey` and current `pagePath`
* comments from `/books` do not appear on `/checkout` by default
* comment creation stores viewport, scroll, click, page, and normalized coordinates where applicable
* if a component disappears, its old comments remain visible in the page comments list
* missing-component comments can be viewed, resolved/unresolved, and deleted
* markers render near found components where possible
* coordinate fallback is used when useful
* user can copy/download current-page feedback for an AI agent
* copied feedback includes general page comments, page-position comments, found component comments, and missing component comments
* no screenshot functionality exists in phase 1
* README.md is generated
* CLAUDE.md is generated
* TypeScript checks pass

Favor a working, understandable prototype over perfect architecture. Keep the UI polished enough to demo. Use practical implementation choices and document limitations clearly.

Make sure to commit your work to git as you go just in case as you make progress.

Do you have any questions before you begin?
