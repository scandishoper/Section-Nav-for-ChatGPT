# Certification testing notes

## Purpose

The extension adds a Section Rail for h1/h2/h3 headings in the currently read ChatGPT assistant answer and stores user-created section bookmarks locally.

## Test steps

1. Install the submitted ZIP package in Microsoft Edge.
2. Open `https://chatgpt.com/` and sign in with a test account.
3. Open a conversation containing a long assistant answer with multiple Markdown headings.
4. Verify that the Section Rail appears between the answer content and ChatGPT's native Conversation TOC when space permits.
5. Scroll the answer and confirm that the active section marker changes.
6. Click a section and confirm smooth navigation to the corresponding heading.
7. Hover a section, click the star, refresh the page, and confirm the bookmark persists.
8. Open the Bookmark Drawer from the Rail header and click the saved bookmark.
9. Switch to another conversation and confirm bookmarks are isolated by conversation.
10. Switch between ChatGPT light and dark themes and resize the browser window.

## Permissions

- `storage`: local persistence of user-created bookmarks.
- `https://chatgpt.com/*`: content-script scope needed to read headings and render the local UI enhancement.

## Network and code behavior

- No remote code.
- No analytics or telemetry.
- No backend requests.
- No ChatGPT private API access.
- No modification of ChatGPT requests or responses.

## Reviewer note

The extension is intentionally hidden when no assistant answer is available or when the viewport cannot fit even the Mini Rail without overlapping ChatGPT content.
