# Account Redesign Design

Date: 2026-04-08
Status: Approved for implementation
Primary owner: Recovery Compass app
Intended audience: Codex, Gemini, frontend engineers, product collaborators

## 1. Goal

Redesign the current `Profile` area into a premium, identity-first `Account` experience.

This should feel calmer, cleaner, and more intentional than the current long utility-style screen.

The redesign must:
- move the product away from a dense information dump
- make the main account surface feel personal and polished
- separate identity, settings, and detailed statistics into the right layers
- prepare for the final navigation architecture where the right-most tab becomes `Account`

This is the first redesign slice before Journal/Routines, Dashboard, and the broader frontend/card overhaul.

## 2. Product Decisions Already Locked

These decisions are approved and should be treated as requirements, not open questions.

### Navigation
- The final app tab architecture will be:
  - `Home | Program | Ground | Journal/Routines | Account`
- `Settings` should **not** be its own tab.
- `Account` is the right-most tab.
- `Settings` lives inside the Account stack.
- `Statistics` also lives inside the Account stack.

### Account screen behavior
- The default Account screen is an **identity-first** profile surface.
- The screen should feel personal first, statistical second.
- Email should be **read-only**.
- `Edit Profile` should open as a **bottom sheet / drawer from the bottom**, not a full-screen editor.
- `Edit Profile` only edits **personal identity fields**.
- The launch version of profile picture support is **gallery upload only**.

### Stats behavior
- The main Account screen should not show many stat cards at once.
- It should show **one featured stat card at a time**.
- The user can **manually swipe** through a few stats.
- There should be a CTA to a dedicated `Statistics` screen.
- No auto-rotating carousel timer.

## 3. Scope of Account v1

This redesign slice should include all of the following.

### In scope
1. Main Account screen redesign
2. Edit Profile bottom sheet
3. Settings screen
4. Statistics screen
5. Profile picture upload from gallery
6. Account information architecture and navigation wiring
7. Re-organization of existing restore/sign-out/delete-account controls into Settings
8. Re-use of current profile/progress/program data where possible

### Out of scope for this slice
1. Dashboard redesign
2. Journal + Routines redesign
3. Mentor workflow tools
4. Calendar sync
5. Full tab-bar visual overhaul if it blocks Account progress
6. Notifications redesign
7. Account-level email change flow
8. Password/account security settings beyond current essentials

## 4. Current State Problems

The current `Profile` screen has these issues:
- it is one long utility screen instead of a premium account experience
- identity is weak compared with projections and destructive actions
- stats and operational settings are mixed together
- delete/sign out/restore purchases are too prominent in the main profile surface
- there is no dedicated statistics destination
- there is no dedicated settings destination
- there is no profile photo flow
- there is no display-name-focused identity editing surface

## 5. Target Experience Summary

The new Account area should feel like this:
- calm
- personal
- premium
- editorial rather than dashboard-heavy
- supportive rather than clinical

The information hierarchy should be:
1. Who the user is
2. What they are currently doing
3. One meaningful progress signal
4. Personal context
5. Deeper controls only when explicitly requested

## 6. Screen Architecture

## 6.1 Account main screen

This is the default screen when the user opens the Account tab.

### Main sections, top to bottom
1. Header
2. Identity block
3. Active program block
4. Featured stat card
5. `View Statistics` CTA
6. Personal context block (`Why You Started`)

### Header
Purpose:
- establish the Account screen as a personal destination
- provide navigation to Settings and Edit Profile actions

Contents:
- title: `Account`
- top-right action: `Settings`
- nearby secondary action or clearly visible inline action: `Edit Profile`

Implementation guidance:
- `Settings` should push to a separate screen in the Account stack
- `Edit Profile` should open a bottom sheet

### Identity block
Purpose:
- give the user a polished personal identity surface

Contents:
- profile picture
- display name
- read-only email

Behavior:
- if no profile photo exists, show a premium placeholder avatar treatment
- if no display name exists, derive a sensible fallback from the email prefix or show a neutral fallback label

### Active program block
Purpose:
- summarize current program context without overwhelming the user

Contents:
- active program name
- optional supporting line such as:
  - current day
  - completion state
  - progress summary

Behavior:
- if no active program exists, show a calm empty state like:
  - `No active program yet`
  - with optional CTA later if needed

### Featured stat card
Purpose:
- keep a premium progress signal visible without cluttering the screen

Behavior:
- only one card visible at a time
- user can manually swipe between available stats
- no auto-rotation timer

Candidate metrics:
- days in motion
- projected savings
- avoided units
- completed program days

Important:
- this should feel like a refined highlight card, not a noisy analytics carousel

### View Statistics CTA
Purpose:
- give access to detailed metrics without crowding the main Account screen

Behavior:
- pushes to dedicated Statistics screen

### Personal context block
Purpose:
- keep the screen emotionally grounded

Contents:
- `Why You Started` content from onboarding

Behavior:
- short, readable, spacious
- this should feel reflective, not like a form dump

## 6.2 Edit Profile bottom sheet

This is the only editing surface in Account v1.

### Must support
- change profile picture
- change display name
- show read-only email

### Must not include
- settings
- password change
- delete account
- notification settings
- recovery goals
- `Why You Started`
- active program changes

### UX notes
- open from bottom sheet / drawer
- should feel lightweight and safe
- save action should be clear and simple
- if image upload is in progress, show a calm loading state

### Profile picture behavior
- launch version uses **gallery upload only**
- no camera capture in v1

## 6.3 Settings screen

This screen contains operational and account-management controls that should not dominate the main Account screen.

### Settings v1 contents
1. Restore Purchases
2. Sign Out
3. Delete Account

### Can remain simple for v1
This screen does not need to be a huge preference center yet.

### Future-friendly but not required now
Later we may add:
- notifications
- privacy / legal
- support
- data export

## 6.4 Statistics screen

This is the detailed analytics destination.

### Purpose
- hold the denser metrics that currently crowd the old profile screen
- let the main Account screen stay elegant

### Candidate contents
- days in motion
- avoided units over time
- projected savings
- daily / monthly / yearly spend
- other meaningful program-related metrics

### UX notes
- present metrics cleanly and with breathing room
- avoid a spreadsheet feel
- this screen can be richer than the main Account screen, but still should not feel clinical

## 7. Data Model Assumptions

The implementation should prefer reusing existing data sources before inventing new backend structures.

### Existing sources already available
- Supabase auth user
- `profiles` row via `useProfile()`
- onboarding response query
- current program access and progress

### Likely new data needed
1. `display_name`
2. `avatar_url` or equivalent profile image reference

These fields should be added in a way that fits the existing `profiles` model.

## 8. Suggested Backend/Data Additions

If needed, extend the `profiles` table with:
- `display_name text`
- `avatar_url text`

If storage is needed for profile images, use a dedicated storage path/bucket convention that can support per-user ownership cleanly.

Example shape:
- bucket: `profile-images`
- path: `<user-id>/avatar.jpg`

Exact bucket design can be finalized during implementation, but ownership/security should be kept simple and explicit.

## 9. Navigation / Routing Plan

Short-term practical recommendation:
- build the Account screen architecture first, even if the route filename still temporarily uses the current `profile` screen path

Then:
1. redesign the current screen into Account
2. add Account stack screens for Settings and Statistics
3. add Edit Profile bottom sheet
4. after the screen structure is solid, complete the tab-bar rename/refactor to the final `Account` tab shape

Reason:
- this reduces navigation churn while the screen itself is being redesigned

## 10. Visual Direction

The Account redesign should feel:
- premium
- spacious
- calm
- personal
- editorial

It should **not** feel like:
- a settings dump
- a medical dashboard
- a metrics wall
- a debug page

### Visual cues
- larger identity treatment near the top
- fewer cards, but better cards
- stronger spacing rhythm
- stat card should feel special, not repetitive
- destructive actions should be visually de-emphasized by moving them into Settings

## 11. Loading / Empty / Error States

### Loading
Eventually the Account redesign should support a refined skeleton state consistent with the broader app loading direction.

For now, implementation should at least ensure loading states feel deliberate and not broken.

### Empty states
Need graceful fallbacks for:
- no display name
- no avatar
- no active program
- missing onboarding projections

### Errors
- failed profile update should show a clear, calm error
- failed avatar upload should be recoverable
- failed restore purchases belongs on Settings, not on the main Account screen

## 12. Acceptance Criteria

The redesign is successful when all of the following are true:

1. The main Account screen feels identity-first, not utility-first.
2. Email is visible but read-only.
3. Display name can be edited.
4. Profile picture can be selected from the gallery.
5. Settings is no longer embedded as the dominant behavior of the main profile surface.
6. Restore Purchases / Sign Out / Delete Account are moved into Settings.
7. The main screen shows one swipeable featured stat card instead of multiple heavy stat modules.
8. A dedicated Statistics screen exists.
9. `Why You Started` remains visible on the main Account surface.
10. The implementation remains compatible with the final `Account` tab architecture.

## 13. Implementation Order Recommendation

Implement in this order:

1. Data support for display name / avatar if missing
2. Main Account screen structure
3. Edit Profile bottom sheet
4. Settings screen
5. Statistics screen
6. Account navigation wiring
7. Final Account tab naming / tab-bar integration

## 14. Notes For Gemini / Frontend Execution

If another model such as Gemini is used for frontend implementation, it should follow these rules exactly:

1. Do not redesign the product decisions listed in this document.
2. Treat `Account` as identity-first.
3. Do not add a dedicated Settings tab.
4. Do not make email editable.
5. Do not turn Edit Profile into a full-screen form.
6. Do not bring Delete Account or Sign Out back onto the main Account surface.
7. Do not show 4 separate stat tiles on the main screen.
8. Use one featured swipeable stat card only.
9. Keep the styling premium and spacious rather than dense.
10. Preserve room for the future 5-tab architecture: `Home | Program | Ground | Journal/Routines | Account`.

## 15. Non-Goals

This redesign is not trying to:
- solve the Dashboard design yet
- solve Journal + Routines yet
- solve mentor workflows yet
- create a full settings/preferences system yet
- create account security-management flows beyond current needs

## 16. Final Summary

Account v1 should transform the current profile area from a long operational page into a premium personal destination.

The main screen should show:
- who the user is
- what they are working on
- one meaningful progress signal
- why they started

Editing should be light.
Settings should be separate.
Statistics should be separate.
The result should feel cleaner, calmer, and more mature than the current implementation.
