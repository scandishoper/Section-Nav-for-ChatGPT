# Firefox / AMO submission checklist

## Package

- Upload `section-nav-for-chatgpt-firefox-amo-v1.0.0.zip` to addons.mozilla.org.
- Choose desktop Firefox as the compatible platform.
- Keep the extension ID `section-nav-for-chatgpt@scandi.local` unchanged after first submission.
- Confirm version `1.0.0` and Manifest V3 validation.

## Source review

- Indicate that source code is required because Vite bundles the production JavaScript.
- Upload `section-nav-for-chatgpt-firefox-source-v1.0.0.zip` as the matching source package.
- Copy relevant details from `AMO_REVIEW_NOTES.md` into Notes for Reviewers.

## Listing

- Use the English and Chinese listing drafts.
- Select Productivity or the closest available category.
- Upload the 128×128 icon if AMO requests a separate listing icon.
- Capture real screenshots from the installed release rather than using conceptual mockups.

## Privacy and support

- Confirm that required data collection is `none`.
- Host `PRIVACY_POLICY.md` at a public HTTPS URL if requested by the listing workflow.
- Replace all support-contact placeholders before submission.

## Signing

- AMO-listed and self-distributed persistent installations require Mozilla signing.
- The generated local package is intended for `about:debugging` temporary installation only.
