# India Reality Bento Design

Date: 2026-03-28

## Goal

Replace the old smoking-only `Reality` homepage section with a broader multi-program section that still fits the existing bento layout and animation style.

## Approved Direction

- Keep the current section placement and responsive structure.
- Keep the desktop composition as a 2-card top row and 3-card bottom row.
- Use India-specific statistics wherever strong sources are available.
- Cover the platform pillars instead of forcing one stat per program.

## Card System

1. `The Sleep Strain`
   - AIIMS meta-analysis on obstructive sleep apnea in Indian adults
   - Core numbers: 11% overall, 13% men, 5% women, ~10.4 crore working-age adults

2. `The Movement Gap`
   - National Noncommunicable Disease Monitoring Survey
   - Core numbers: 41.4% overall insufficient physical activity, 52.4% women, 51.7% urban adults

3. `The Tobacco Burden`
   - WHO / GATS 2 India
   - Core numbers: 28.6% any tobacco, 21.4% smokeless, 10.7% smoking, ~267 million adults

4. `The Metabolic Load`
   - ICMR-INDIAB
   - Core numbers: 39.5% abdominal obesity, 35.5% hypertension, 28.6% general obesity

5. `The Support Gap`
   - National Mental Health Survey of India
   - Core numbers: 5.1% current CMD prevalence, 80.4% treatment gap, ~Rs 1500/month average family spend

## Implementation Decision

The initial plan was to add a charting library. In this environment, package installation did not complete, so the final implementation uses custom SVG, conic-gradient, and motion-based visuals inside the existing component.

This keeps the section visually bespoke and avoids introducing a new dependency only for one editorial section.
