# Website Citations and Disclaimer Plan

Date: 2026-04-17
Scope: Website only for now
Status: Parked for follow-up after database cleanup

## Goal

Add a clear citations/disclaimer page on the website so the app can link to it, and keep the structure ready for the app-side citation work that Apple likely expects in review.

## Why This Exists

Apple's rejection was about medical or health information not showing citations clearly enough. A website page alone is not the full fix, but it is still useful as supporting documentation and a stable public reference page.

## Tight Checklist

1. Create a new website page for citations and disclaimer content.
2. Reuse the existing legal-page layout pattern used by Privacy Policy and Terms.
3. Add the new page link to the footer legal links.
4. Put a concise disclaimer at the top of the page.
5. Group citations by topic so the page is easy to scan.
6. Make sure every citation has a source title and a direct source link.
7. Keep the page copy clean and non-defensive so it reads like a reference page, not a legal dump.
8. Once the page is live, use its URL in the app and in App Review notes.

## Website Deliverable

- New page route: `/citations` or `/sources`
- Page sections:
  - Short disclaimer
  - Source list grouped by topic
  - Optional note explaining that the app references these sources in context
- Footer update:
  - Add the new link beside Privacy Policy and Terms & Conditions

## Gemini Prompt

Use this prompt when you are ready to have Gemini build the website page:

```text
I need you to add a new website page for Recovery Compass that serves as a citations and disclaimer page.

Important context:
- This is website-only for now.
- I will provide the citations content and the source links separately.
- Your job is to take that content and add it into the page cleanly.
- The page should match the existing legal-page style used by the Privacy Policy and Terms pages.
- The new page should be easy to read, structured, and polished enough to satisfy App Review support documentation.

What I want you to build:
1. A new page route for citations/disclaimer content.
2. A short disclaimer at the top explaining that the content is informational and not medical advice.
3. A grouped list of citations with source titles and direct links.
4. A footer link to the new page alongside Privacy Policy and Terms & Conditions.

Design and writing requirements:
- Keep the layout consistent with the current legal pages.
- Make the page feel clear, trustworthy, and easy to scan.
- Use concise section headings and readable spacing.
- Do not invent citations or source links. I will provide the exact content.
- If the content needs small cleanup for formatting or clarity, do that, but do not change the meaning.

When I send the citations and source links, insert them into the page and wire up the footer link.
```

## Notes for the Later App Fix

- The actual App Store fix still needs in-app citation access on the medical content screens.
- This website page is a supporting asset and a place to centralize references.
- When we come back to the app work, the same citation list should ideally be reused rather than duplicated.

## Success Criteria

- The website has a public citations/disclaimer page.
- The footer links to it.
- The page is ready to receive the final citation content from Gemini without redesigning the page structure.
- The doc is saved for quick pickup after the database cleanup.
