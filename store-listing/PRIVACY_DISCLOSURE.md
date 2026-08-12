# Partner Center privacy disclosure draft

## Single purpose

Provide heading-level navigation and local section bookmarks for the ChatGPT answer currently being read.

## Permission justification

### `storage`

Required to persist user-created section bookmarks in `chrome.storage.local` so they remain available after page refreshes and browser restarts. The permission is not used for analytics, tracking, or remote synchronization.

## Remote code

Select: **No, I am not using remote code.**

All executable code is bundled in the submitted Manifest V3 extension package.

## Data usage disclosure

The extension accesses website content consisting of heading text and limited message metadata on the currently open `chatgpt.com` page. This data is processed locally to render navigation and resolve bookmarks. The developer does not collect or receive this data, and no data is transmitted to third parties.

Bookmark metadata is stored locally in the user's browser profile. Disclose website content access conservatively and ensure the Partner Center answers remain consistent with the hosted privacy policy.

## Privacy policy

Host `PRIVACY_POLICY.md` at a stable public HTTPS URL controlled by the publisher, then enter that URL in Partner Center before submission.
