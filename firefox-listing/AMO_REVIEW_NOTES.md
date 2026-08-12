# AMO reviewer notes

## Single purpose

The extension provides heading navigation and local section bookmarks for the active answer on `chatgpt.com`.

## Test instructions

1. Install the extension and open `https://chatgpt.com/`.
2. Open a conversation containing an assistant answer with H1, H2, or H3 headings.
3. Confirm that the Section Rail appears beside the active answer.
4. Scroll through multiple answers and confirm that the active Rail follows the answer being read.
5. Select a Rail item and confirm that the corresponding heading is focused and highlighted.
6. Select the star control, open the Bookmark Drawer, and confirm that the bookmark is listed.
7. Switch conversations and return; confirm that the bookmark remains available only in its original conversation.
8. Remove the bookmark and confirm that it disappears from local storage state.
9. Test in both ChatGPT light and dark themes.

## Permissions

- `storage`: stores user-created section bookmark metadata in Firefox local extension storage.
- `https://chatgpt.com/*`: reads visible assistant headings and injects the navigation UI on ChatGPT only.

## Data and network behavior

- `browser_specific_settings.gecko.data_collection_permissions.required` is `none`.
- No user data is transmitted outside the extension or local browser.
- No analytics, telemetry, advertisements, backend, remote code, or private ChatGPT API is used.

## Third-party libraries

- React: https://github.com/facebook/react
- React DOM: https://github.com/facebook/react/tree/main/packages/react-dom

The production JavaScript is bundled by Vite. Matching source code and deterministic npm build instructions are provided in the source archive.

`web-ext lint` reports two static `UNSAFE_VAR_ASSIGNMENT` warnings inside the bundled React DOM library. The extension source does not use `innerHTML` or `dangerouslySetInnerHTML`; these warnings come from generic React DOM implementation branches and no page or conversation content is passed to an HTML injection API.
