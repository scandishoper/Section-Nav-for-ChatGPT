# Microsoft Edge Add-ons submission checklist

Official workflow reference: https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension

## Package

- Upload `section-nav-for-chatgpt-edge-store-v1.0.0.zip`.
- Confirm Manifest V3, version `1.0.0`, and the single `storage` permission.
- Confirm no remote code and no unexpected package-validation warnings.

## Availability

- Recommended visibility: Public.
- Recommended markets: all markets unless the publisher has a specific restriction.

## Properties

- Category: Productivity.
- Mature content: No.
- Add a publisher-controlled support email or support URL.
- Add a publisher-controlled website URL if available.

## Privacy

- Use `PRIVACY_DISCLOSURE.md` as the Partner Center response draft.
- Host `PRIVACY_POLICY.md` at a public HTTPS URL and replace the placeholder contact paragraph.
- Keep all disclosures consistent with the package behavior.

## Store listing

- Add at least one language. Drafts are provided for `en-US` and `zh-CN`.
- Upload `logo-300.png` for each language or duplicate it across languages.
- Optional promotional assets are provided at exactly 440×280 and 1400×560.
- Product screenshots are optional. Capture the final installed extension at 1280×800 before submission if screenshots are desired; do not use conceptual mockups as product screenshots.

## Final external actions

- Replace publisher contact placeholders.
- Host the privacy policy.
- Sign in to Partner Center with the publisher's Microsoft Edge developer account.
- Upload, complete the listing forms, add certification notes, and submit for review.
