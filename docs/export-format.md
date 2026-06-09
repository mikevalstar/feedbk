# AI Agent Feedback Export Format

Produced by `packages/feedback-client/src/exportText.ts` via the "Copy Feedback for AI Agent" / "Download Feedback" actions. Always covers the **current page** only (all statuses; resolved comments are included and labelled).

## Structure

1. Instruction preamble for the coding agent.
2. Project / page / URL / export timestamp.
3. Summary counts (total / open / resolved).
4. Four groups, each omitted-with-a-note when empty:
   - General Page Comments
   - Page-Position Comments
   - Component Comments - Found (component currently present in the DOM)
   - Component Comments - Missing (component not found at export time)

Found/missing is evaluated live at export time using the same anchoring logic as markers.

## Per-comment fields

Every comment block includes: comment id (heading), status, author `Name <email>`, created timestamp (plus updated timestamp when it differs), and the feedback body. Component comments add component name, component tag (`data-ref` value) and found/missing status; positioned comments add client and normalized coordinates. Missing-component comments add an explicit note that the component was absent at export time.

## Example

```txt
# Design Feedback Export

You are a coding agent working on this application.

Apply the following design-review feedback for the page below.

Use component names, component metadata, and coordinates as hints. If a referenced component no longer exists, infer the most likely current component or page area from the comment text and page context. Do not remove unrelated functionality. Make focused changes that address the feedback.

Project: sample-library
Page: /books
URL: http://localhost:5173/books
Exported: 2026-06-09T15:30:00.000Z

Summary:
- Total comments: 4
- Open comments: 3
- Resolved comments: 1

## General Page Comments

### Comment cmt_a1b2c3
Status: open
Author: Mike <mike@example.com>
Created: 2026-06-09T15:20:00.000Z

Feedback:
The page feels too busy. Reduce visual noise.

## Page-Position Comments

### Comment cmt_d4e5f6
Status: open
Author: Jane <jane@example.com>
Created: 2026-06-09T15:21:00.000Z
Position:
- clientX/clientY: 420, 260
- normalizedX/normalizedY: 0.328, 0.241

Feedback:
This area needs a stronger empty state.

## Component Comments - Found

### Comment cmt_g7h8i9
Status: resolved
Author: Mike <mike@example.com>
Created: 2026-06-09T15:22:00.000Z
Component: BookCard
Component Tag: src/components/BookCard.tsx#L12-14
Component Found: yes
Position:
- clientX/clientY: 810, 480
- normalizedX/normalizedY: 0.633, 0.444

Feedback:
Make the due date more prominent.

## Component Comments - Missing

### Comment cmt_j0k1l2
Status: open
Author: Sarah <sarah@example.com>
Created: 2026-06-09T15:23:00.000Z
Original Component: OverdueNotices
Component Tag: src/components/OverdueNotices.tsx#L8-10
Component Found: no

Note:
The original component was not found on the page when this export was generated.

Feedback:
The overdue warning color is too subtle.
```

## Stability contract

Coding agents and humans both consume this; if you change the format, update this document, the README section, and any prompts that rely on the group headings (`## Component Comments - Missing` etc.) in the same change.
