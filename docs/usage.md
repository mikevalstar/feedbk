# Usage Guide

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 — the sample library app loads with the feedback tool injected. The backend API runs on http://localhost:4000.

## First use: identity

The first time you interact with the pencil button you are asked for a **name** and **email**. These are stored in `localStorage` under `design-feedback:identity` and attached to every comment you create. Clear that key (or use the "Change identity" item in the pencil menu) to re-enter them. There is no authentication — this is self-reported identity for an internal review tool.

## The pencil menu

The floating pencil button sits in the bottom-right corner. Clicking it opens a menu:

| Item                        | What it does                                                            |
| --------------------------- | ----------------------------------------------------------------------- |
| Add component comment       | Enter component-pick mode: tagged components highlight on hover; click one to open the comment form |
| Add page-position comment   | Enter position-pick mode: click anywhere on the page to drop a comment there |
| Add general page comment    | Opens the comment form immediately; the comment attaches to the page as a whole |
| View page comments          | Opens the comments panel for the current page                            |
| All pages with comments     | Popover listing every page in the project that has feedback, with open/resolved counts and links to jump there |
| Toggle markers              | Show/hide the on-page comment pins                                       |
| Show/hide resolved          | Include or exclude resolved comments in markers and the panel            |
| Copy Feedback for AI Agent  | Copies the current page's feedback as a structured AI prompt             |
| Download Feedback           | Saves the same export as a Markdown file                                 |

Press `Esc` at any time to leave a pick mode.

## Comment types

- **Component comment** — anchored to a component tagged by `vite-plugin-component-tagger` (anything carrying a `data-ref` attribute). Stores component metadata *and* coordinates as a fallback.
- **Page-position comment** — anchored to a clicked point on the page. Stores coordinates only.
- **General page comment** — anchored to the page itself. No component, no coordinates.

All comments store: project key, page path (`location.pathname`), full URL, body, author name/email, status (`open`/`resolved`), and created/updated timestamps.

## Page scoping

Comments belong to a `projectKey` + `pagePath`. You only ever see the current page's comments by default: feedback left on `/books` is invisible on `/checkout` and vice versa. SPA navigation is detected automatically and the comment set reloads.

## Markers

Each visible comment gets a numbered pin:

1. Component comments pin to the live component when it can be found (exact `data-ref` match, then file-path prefix match).
2. If the component is gone — or for page-position comments — the pin falls back to the stored normalized viewport coordinates.
3. If nothing sensible can be drawn, the comment appears only in the panel.

Clicking a pin opens the panel and highlights that comment.

## When a component disappears

Component comments whose component can't be found on the page are **never hidden**. They show in the panel under "Component missing" with the notice:

> Component not currently found on this page. Originally attached to: BookCard.

They stay editable, resolvable and deletable. To see this in the sample app: comment on the "Overdue notices" section on `/books`, then switch the section off with its toggle.

## Resolving, editing, deleting

In the comments panel each comment has **Resolve/Reopen**, **Edit** (inline body edit) and **Delete** actions. Resolved comments are hidden by default; flip "Show resolved" in the menu or panel to see them.

## Exporting feedback for an AI agent

"Copy Feedback for AI Agent" builds a single text block for the current page: an instruction preamble for the agent, project/page/URL/export-timestamp, summary counts, then every comment grouped as general / page-position / component-found / component-missing, with ids, statuses, authors, timestamps, component tags and coordinates. See [export-format.md](export-format.md).

On success you'll see *"Feedback copied to clipboard."* If the clipboard API fails (e.g. permissions), a modal opens with the text preselected in a textarea for manual copying. "Download Feedback" writes the same content to a `.md` file.

## Testing checklist (sample app)

1. Pencil button visible bottom-right on `/books` and `/checkout`.
2. First interaction prompts for name/email; persists across refresh.
3. Create all three comment types on `/books`; refresh; all persist.
4. `/checkout` shows none of them; comments made there don't leak back.
5. Toggle "Show overdue notices" off → its comments flagged missing but fully usable.
6. Resolve, edit, delete each type — including a missing-component comment.
7. Export copies all groups; disable clipboard permission to check the fallback modal.
