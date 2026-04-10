# Pinned Session Transport Design

Date: April 10, 2026
Branch: `rebuild/multi-program`
Status: deferred until after App Store review submission

## Summary

Recovery Compass should eventually replace duplicated in-card playback controls with one shared session transport pinned to the bottom of the day-detail screen.

This transport should support the two playable V1 card families:

- `audio`
- `breathing_exercise`

The user asked to keep this feature out of the pre-review release candidate, so the implementation is explicitly deferred until after the app is submitted for review. The launch build should continue using the existing card-local controls.

## Product Goal

When a user is on a playable card, the control surface should stay anchored at the bottom so the content remains visually focused and the interaction model stays consistent.

The transport should:

- stay pinned above the home indicator
- feel shared across playable card types rather than custom per card
- allow a user to start, pause, resume, and restart a session
- keep the card body focused on guidance and visuals instead of duplicated controls

## Why Defer Until After Review

- It changes a core part of the day-detail interaction model.
- It adds new playback state coordination at the screen level.
- It affects both audio and breathing cards, which increases regression surface shortly before review.
- The current release candidate is safer if we preserve the existing card-local controls for launch.

## UX Rules

### Audio Cards

- When the current card is an `audio` card, show the pinned transport.
- The transport should expose:
  - left action: `Restart`
  - right action: `Play`, `Pause`, or `Resume`
- The transport should show elapsed time and total duration.
- If the card declares `autoAdvance`, finishing playback should continue to the next card.
- Swiping away from the audio card should stop playback and reset position.

### Breathing Cards

- When the current card is a `breathing_exercise` card, show the pinned transport.
- The transport should expose:
  - left action: `Restart`
  - right action: `Start`, `Pause`, or `Resume`
- The breathing visual remains in the card body.
- The card should not show an extra inline CTA when the pinned transport is active.
- Swiping away from the breathing card should reset that session state.

### Non-Playable Cards

- No pinned transport should appear.
- Existing day-detail flow should remain unchanged.

## UI Direction

The pinned transport should feel editorial and quiet rather than utility-heavy.

Recommended treatment:

- dark forest glass or dark forest solid surface
- soft rounded container with continuous corners
- clear title and short supporting line
- low-noise status copy such as `Paused and ready to resume`
- two-button layout with asymmetric emphasis:
  - secondary reset/restart on the left
  - primary play state action on the right

The bar should not feel like a media app mini-player. It should feel like a calm session controller.

## Architecture

### Screen Ownership

`app/day-detail.tsx` should own the shared transport state.

Reason:

- it already owns pager state
- it knows which card is currently active
- it already owns the screen-level bottom chrome for completion surfaces

### Card Renderer Role

`components/cards/CardRenderer.tsx` should stay presentation-focused.

It should:

- render the content body
- show the breathing visual
- show audio copy and intent
- accept optional screen-level control props when a shared transport is enabled

It should not own the canonical playback state once this feature is enabled.

### Audio Controller

A dedicated hook should manage audio transport behavior.

Recommended file:

- `hooks/useProgramAudioController.ts`

Responsibilities:

- prefetch and cache audio when possible
- load current audio source
- play / pause / resume / restart
- expose status, loading, and cache state
- stop and reset when the active card changes

### Shared Component

A dedicated UI component should render the pinned bar.

Recommended file:

- `components/program/SessionTransportBar.tsx`

Responsibilities:

- transport layout
- title / subtitle / progress / status rendering
- primary and secondary action buttons
- no direct audio or breathing business logic

## State Model

### Audio

Screen-level audio state should include:

- current active audio source
- loaded state
- playing state
- current time
- duration
- cache status
- loading state
- recoverable error state

### Breathing

Screen-level breathing state should include:

- whether the breathing session has been started
- whether it is currently playing or paused
- a restart token or equivalent reset signal for the card visual

## Integration Points

### Files To Touch Later

- `app/day-detail.tsx`
- `components/cards/CardRenderer.tsx`
- `components/program/ProgramAudioPlayer.tsx` or a successor hook
- `components/program/SessionTransportBar.tsx`
- `hooks/useProgramAudioController.ts`

### Existing Behaviors To Preserve

- pager swipe behavior
- journal save / continue flow
- close-card completion flow
- day progress persistence
- existing non-playable card rendering
- auto-advance for supported audio cards

## QA Checklist For Post-Review Implementation

- Audio card shows pinned transport only on the active card.
- Audio `Restart` resets to `0:00` and starts playback cleanly.
- Audio stops when user swipes off the card.
- Audio auto-advance still works when configured.
- Breathing card shows pinned transport only on the active card.
- Breathing visual responds to `Start`, `Pause`, `Resume`, and `Restart`.
- No overlap with the home indicator on iPhone.
- No overlap with Android gesture navigation.
- No duplicate inline and pinned playback CTAs.
- No regressions in day completion or journal flow.

## Not In Scope For The First Post-Review Pass

- waveform visualization
- lockscreen media controls
- background audio continuation
- mindfulness timer transport
- haptic breathing cues
- per-session analytics beyond existing day/card state

## Recommended Delivery Order After Review

1. Build `useProgramAudioController`
2. Build `SessionTransportBar`
3. Integrate shared transport for `audio` cards only
4. QA audio behavior thoroughly
5. Integrate shared transport for `breathing_exercise` cards
6. Polish copy and spacing
7. Run final device QA on iPhone and Android

## Launch Decision

For the review build, keep the current implementation:

- audio remains controlled in-card
- breathing remains controlled in-card
- no pinned session transport ships before review

This keeps the release candidate stable while preserving a clear, already-shaped post-review implementation path.
