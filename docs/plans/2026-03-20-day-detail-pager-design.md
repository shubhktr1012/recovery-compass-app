# Day Detail Pager Design

Date: 2026-03-20
Status: Approved
Branch: `rebuild/multi-program`

## Purpose

Add a new immersive V2 day-detail preview screen that renders card-based day
content in a full-screen pager.

This screen validates the core swipe-through experience before the existing
program flow is replaced.

## Source Context

- Rebuild spec: `../../../MASTER_CONTEXT.md`
- V2 content foundation:
  `docs/plans/2026-03-20-multi-program-content-foundation-design.md`

## Route

- Screen file: `app/day-detail.tsx`
- Expo Router path: `/day-detail`
- Params:
  - `programSlug`
  - `dayNumber`

The screen lives outside `(tabs)` so the tab bar stays hidden naturally.

## Data Flow

1. Read route params using `useLocalSearchParams`
2. Validate `programSlug` and `dayNumber`
3. Load the day from `ContentRepository.getDay(programSlug, dayNumber)`
4. Render each card as one full-screen page inside `react-native-pager-view`

## Interaction

- Swipe horizontally between pages
- Tap left half to go to previous page
- Tap right half to go to next page
- Back button at top-left returns to the previous screen

## Progress Persistence

- Save current card index on every page change to AsyncStorage
- Storage key: `progress:{programSlug}:{dayNumber}`
- Restore saved index on mount
- If resuming from a saved position greater than zero, show a subtle temporary
  toast: `Continuing where you left off`

## UI Rules

- Background: `bg-surface`
- Each page uses `SafeAreaView` and `p-6`
- Thin segmented progress bar at top
- Use `FadeIn` from Reanimated for page/card entry
- Trigger light haptic feedback on page changes
- If day content is missing, show an error state instead of a blank screen

## Router Consideration

The current root layout redirects subscribed users to `(tabs)` whenever they
are on a top-level route. This phase must allow `/day-detail` explicitly so the
new screen is reachable while keeping the rest of the auth/subscription guard
behavior intact.

## Implementation Sequence

1. Install `react-native-pager-view`
2. Add `/day-detail` screen
3. Allow `/day-detail` in root routing logic
4. Verify typecheck
5. Commit the feature slice
