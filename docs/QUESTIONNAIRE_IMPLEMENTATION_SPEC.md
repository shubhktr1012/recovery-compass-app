# Multi-Program Questionnaire — Implementation Spec

> Source: Marketing & App Details doc from Anjan
> Replaces: V1 `app/(auth)/personalization.tsx` (smoking-only)
> New file: `app/(auth)/questionnaire.tsx`

## Architecture

One adaptive questionnaire engine. NOT separate questionnaires per program.

The flow has 3 phases:
1. **Shared entry** (slides 1-2): Demographics + primary concern selection
2. **Branch-specific** (slides 3-9): Copy and options change based on the concern
3. **Shared persuasion arc** (slides 10-14): Same structure, dynamic [Answer] injection

The primary concern on Slide 2 determines which program gets recommended.

## Program Routing

| Slide 2 Answer | Recommended Program | Slug |
|---|---|---|
| Smoking/addiction related | 90-Day Quit | `ninety_day_transform` |
| Chronic fatigue / belly fat / brain fog | Age Reversal | `age_reversal` |
| Terrible sleep / exhaustion | Sleep Reset | `sleep_disorder_reset` |
| Afternoon crash / zero stamina | Energy Reset | `energy_vitality` |
| Performance / vitality (male only) | Men's Vitality | `male_sexual_health` |

For launch (3 programs), only show options that route to: `ninety_day_transform`, `age_reversal`, and `six_day_reset`. The others appear when content is ready.

## Slide-by-Slide Spec

### Slide 1 — Demographics
- **Type:** Input fields
- **Title:** "Let's build your profile."
- **Fields:**
  - Name (text input, required)
  - Age (number input, required)
  - Gender (single select: Male, Female, Prefer not to say)
- **Stored as:** `name`, `age`, `gender` in questionnaire state

### Slide 2 — Primary Concern (THE BIG FORK)
- **Type:** Single select cards
- **Title:** "Nice to meet you, [Name]. In your day-to-day life, what is the biggest friction holding you back right now?"
- **Options (for launch — 3 programs):**
  - "Smoking or substance dependence" → routes to smoking branch
  - "Chronic fatigue, stubborn weight, or brain fog" → routes to age reversal branch
  - "Feeling controlled by cravings" → routes to smoking branch
  - "Hidden stress that never stops" → routes to age reversal branch
- **Gender-gated (shown only to males):**
  - "Performance anxiety or low vitality" → routes to men's vitality (post-launch)
- **Stored as:** `primaryConcern`

### Slide 3 — Duration of Problem (branch-specific copy)
- **Type:** Single select
- **Title varies by branch:**
  - Smoking: "How many times have you silently promised yourself you would quit, only to start again?"
  - Age Reversal: "How long has [Answer from Slide 2] been actively slowing you down?"
  - Sleep: "How long has this wired-but-tired loop been silently killing your daily stamina?"
- **Options:**
  - Smoking: "1-2 times", "3-5 times", "I've lost count"
  - Others: "A few months", "1-3 years", "Feels like forever"
- **Stored as:** `durationAnswer`

### Slide 4 — Reality Check (info slide, no input)
- **Type:** Statement with dynamic [Age]
- **Copy varies by branch:**
  - Smoking: "You are [Age] years old. But did you know the average working professional who smokes just 5 cigarettes a day has a vascular and lung age 10-15 years older?"
  - Age Reversal: "You are [Age] years old. But did you know the average Indian metro professional has a biological heart and liver age that is 10-15 years older?"
  - Sleep: "You are [Age] years old. But did you know that just 6 hours of fragmented sleep ages your brain's cognitive function by a full decade?"
- **No input needed** — just a "Continue" button

### Slide 5 — Lifestyle Question (branch-specific)
- **Type:** Single select
- **Title varies by branch:**
  - Smoking: "What is your biggest daily trigger?"
    - Options: "Office stress/meetings", "Post-meal cravings", "Socializing/Drinking", "Morning routine"
  - Age Reversal: "Does your current lifestyle allow you to truly disconnect?"
    - Options: "Yes easily", "Sometimes", "No I'm always on"
  - Sleep: "What usually keeps you awake?"
    - Options: "Work stress & planning", "Doom scrolling", "Racing thoughts", "Staring at the ceiling"
- **Stored as:** `lifestyleAnswer`

### Slide 6 — Behavioral Data (branch-specific)
- **Type:** Input or select
- **Varies by branch:**
  - Smoking: "How many cigarettes does your nervous system currently rely on?" (number input)
  - Age Reversal / Sleep / Energy: "How many hours a day are you looking at a screen?" (select: <6, 6, 8, 8+)
- **Stored as:** `behavioralData`

### Slide 7 — The False Mountain (info slide)
- **Type:** Statement, no input
- **Copy varies by branch:**
  - Smoking: "The pharmaceutical industry makes billions pushing nicotine patches, gums, and chemical pills that simply replace one dependency with another."
  - Age Reversal: "Tech billionaires like Bryan Johnson spend millions a year on unproven gadgets, 100+ daily pills, and extreme tech just to reverse their biological age."
  - Sleep: "Tech billionaires spend millions on cooling mattresses, wearable sleep trackers, and lab-grade pharmaceuticals just to force 8 hours of rest."

### Slide 8 — The Relatable Trap (branch-specific select)
- **Type:** Single select
- **Title:** "But for the rest of us, what do we usually rely on?"
- **Options vary by branch:**
  - Smoking: "Cold turkey/Willpower", "Switching to vapes", "Reading a self-help book", "Distracting ourselves"
  - Age Reversal: "Endless caffeine", "Melatonin/sleeping pills", "Scrolling to numb the brain", "Crash diets"
  - Sleep: "Endless scrolling", "Melatonin gummies", "Evening alcohol", "Sleeping pills"
- **Stored as:** `copingMethod`

### Slide 9 — Micro-Commitment on Failure (single button)
- **Type:** Single confirmation button
- **Copy:** "And honestly... have those quick fixes actually reversed your [primaryConcern], or do they just temporarily mask it?"
- **Button text:** "They just mask it. I'm still stuck."
- **No stored value** — this is a psychological pivot moment

### Slide 10 — The Pivot (info slide)
- **Type:** Statement, no input
- **Copy:** "What if the ultimate bio-hack isn't a new pill, an expensive gadget, or a modern trend? What if it's a forgotten rhythm?"

### Slide 11 — Solution Reveal (info slide)
- **Type:** Statement, no input
- **Copy:** "Modern neuroscience is finally validating what ancient Indian sages knew centuries ago. Specific, targeted protocols — like circadian light exposure, autonomic breathwork, and dopamine fasting — can actively reverse biological aging and restore natural vitality."

### Slide 12 — Commitment (single button)
- **Type:** Single confirmation button
- **Copy:** "We are building your custom protocol right now. If we give you a simple, science-backed ancient protocol that takes just 15 minutes a day... are you ready to commit?"
- **Button text:** "Yes, I am fully committed."

### Slide 13 — Analysis Animation
- **Type:** Animated screen, no input, auto-advance after 3-4 seconds
- **Copy lines (appear sequentially):**
  - "Analyzing your inputs..."
  - "Calculating biological stress load..."
  - "Matching with ancient protocols..."
- **Visual:** Progress animation, dots or loading bar
- **After animation:** Navigate to recommendation/paywall

### Slide 14 — Recommendation + Paywall
- **Type:** Program recommendation with purchase CTA
- **Copy:** "Your [Protocol Name] is ready. Based on your inputs, your [primaryConcern] is highly reversible."
- **Shows:** The 3 phases of the recommended program
- **CTA:** "Unlock your plan now" → triggers RevenueCat purchase
- **This can be a separate screen** (`app/paywall.tsx` redesigned) rather than part of the questionnaire

## Data Storage

On completion (before paywall), save to Supabase `profiles`:
```sql
questionnaire_completed = true
primary_concern = [Slide 2 answer]
recommended_program = [program slug]
questionnaire_answers = {
  name, age, gender, primaryConcern, durationAnswer,
  lifestyleAnswer, behavioralData, copingMethod
}
onboarding_completed_at = NOW()
```

Also update `onboarding_complete = true` so the auth guard lets the user through.

## UI Design Direction

Follow the V4 wellness design language:
- Light sage/cream background
- Large serif titles (font-erode-bold) for each slide's headline
- Generous spacing, one question per screen
- Selection cards: white with forest green border when selected, subtle press animation
- Input fields: rounded, sage-mist background, forest green text
- "Continue" button: pill-shaped, deep forest green, full width at bottom
- Info slides: centered text, larger font size, no input elements
- Analysis animation: centered, use Reanimated for staggered text reveal
- Progress indicator: thin segmented bar at top (same style as day-detail)

## Implementation Notes

- Replace `app/(auth)/personalization.tsx` contents (or create new `questionnaire.tsx` and update the auth layout)
- Use local component state for the multi-step wizard (useState for step index + answers object)
- Each slide is a function component rendered by a switch statement based on step index
- "Back" button on each slide (except slide 1) to go to previous step
- Haptic feedback on selection and step transitions
- The auth guard in `_layout.tsx` checks `profile.onboarding_complete` — this questionnaire sets it to true on completion
- Keyboard avoiding view needed for input slides (1, 6)

## Branch Copy Map (for the switch statement)

```typescript
type Branch = 'smoking' | 'age_reversal' | 'sleep' | 'energy' | 'male_vitality';

function getBranch(primaryConcern: string): Branch {
  if (primaryConcern.includes('smoking') || primaryConcern.includes('craving'))
    return 'smoking';
  if (primaryConcern.includes('fatigue') || primaryConcern.includes('brain fog') || primaryConcern.includes('stress'))
    return 'age_reversal';
  if (primaryConcern.includes('sleep') || primaryConcern.includes('exhaustion'))
    return 'sleep';
  if (primaryConcern.includes('crash') || primaryConcern.includes('stamina'))
    return 'energy';
  if (primaryConcern.includes('performance') || primaryConcern.includes('vitality'))
    return 'male_vitality';
  return 'age_reversal'; // default
}

function getRecommendedProgram(branch: Branch): ProgramSlug {
  switch (branch) {
    case 'smoking': return 'ninety_day_transform';
    case 'age_reversal': return 'age_reversal';
    case 'sleep': return 'sleep_disorder_reset';
    case 'energy': return 'energy_vitality';
    case 'male_vitality': return 'male_sexual_health';
  }
}
```
