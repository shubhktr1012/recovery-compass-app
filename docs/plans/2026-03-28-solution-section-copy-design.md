# Solution Section Copy Design

Date: 2026-03-28

## Goal

Upgrade the homepage `Solution` section so it reflects the multi-program Recovery Compass positioning from the client docs without changing the existing scroll choreography.

## Direction

- Keep the section as a three-step, visually guided support story.
- Rename the section from `The Solution` / `Recovery Toolkit` to `How It Works`.
- Make the section process-oriented rather than anti-craving or smoking-specific.
- Avoid repeating hero and philosophy language too closely.

## Content Model

1. `Awareness`
   - Focus on seeing what shapes the day through check-ins and reflection.

2. `Regulation`
   - Focus on guided audio, breathwork, and grounding to settle the body first.

3. `Momentum`
   - Focus on simple daily guidance that helps healthier routines stick over time.

## Implementation Note

The desktop version previously duplicated the slide copy outside the main `features` array. The update should make the mobile cards and desktop slide text derive from the same data source so future content changes stay consistent.
