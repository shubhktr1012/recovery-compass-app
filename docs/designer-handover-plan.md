# Recovery Compass: UI/UX Design Handover & Phase Plan

Recovery Compass is a guided behavior-change and regulation app focused on calm, structured support for habits, sleep, energy, and daily balance.

As we gear up for our **Phase 1 Launch on April 20th**, we have structured the design roadmap to prioritize the core user experience immediately, followed by deeper system redesigns and brand expansion in later phases.

## The Design Philosophy
Before diving into the phases, please align all designs with our established brand identity.

- **The Vibe:** Calm, grounded, compassionate, and editorial. "Warm luxury."
- **Color Palette:** Light theme default. Use deep forest green (`#06290C`) for authority, sage glaze (`#E3F3E5`) for backgrounds, and warm, tactile off-whites (linen, oat, stone).
- **Avoid:** Flashy startup gradients, neons, or sterile whites.
- **Typography:** We currently use a combination of an editorial serif (`Erode`) for emotional headings and a sans-serif for utility (`Satoshi`). We are looking to update our serif font to something that maintains this premium printed feel.
- **Layout:** Generous whitespace, asymmetric but controlled composition, soft borders. Avoid dense, cluttered dashboards or overly glossy glassmorphism (we can explore this in the future).

## Technical Constraints For Figma Hand-offs

- Our app is built in **React Native (Expo)** using **NativeWind**.
- For gradients, we rely on standard linear background sweeps.
- For micro-animations, we use `react-native-reanimated`.
- In Phase 1, stick to standard transitions like fade and slide, and spring interactions like tap-to-scale.
- Avoid highly complex SVG morphs right before launch.

## Phase 1: Core Product & Launch Polish
**Priority:** Highest
**Target:** April 19

We need to ensure the app is stable, cohesive, and looks professionally finished the moment early users open it for launch on April 20.

### 1. Typography Swap
- Select and implement a replacement for the current heading font (`Erode`) that better fits the warm luxury and editorial vibe.

### 2. Gradient & Color Polish
- Define and integrate subtle, tactile background gradients across existing cards and layout structures.

### 3. Core Tab Redesign
Refine and elevate the 4 main application tabs, prioritizing clarity, premium feel, and daily usability for launch.

- **Home:** Dashboard, today's focus, and quick actions.
- **Program:** List of the user's purchased content and programs.
- **Routine:** Coach-assigned daily schedule view.
- **Profile:** Settings, progress, and account recovery.

### 4. In-Program Card Redesign
- High-fidelity redesign of the daily reading and exercise cards (the swipe-through day view).
- Since this is the core content users are paying for, it must feel deeply premium, readable, and highly polished on day one.

### 5. Foundational Micro-Animations
- Define the core interactive feedback system: fast, subtle button tap-scales, screen-to-screen transitions, and modal appearances.

## Phase 2: Acquisition & Conversion
**Timing:** Post-launch

After launch operations stabilize, focus shifts to the flows that drive conversions, trust, and deeper engagement.

### 1. Interactive Breathing & CALM
- Design the next version of the 10-minute full-screen CALM breathing modal.
- Design day-completion success sequences that feel soothing, rewarding, and memorable.
- Explore richer motion and emotional feedback patterns once launch pressure is behind us.

### 2. Onboarding & Adaptive Questionnaire
- A visual redesign of the 10-step personalization flow.
- It must feel untraditional, deeply personal, and highly trustworthy as it builds the user's plan.

### 3. Premium Paywalls
- High-fidelity redesigns of the purchase screens and program upsells, optimizing for one-time unlocks.

## Phase 3: Brand Identity Expansion & Complex Systems
**Timing:** Future

This phase expands the platform and deepens the brand connection.

### 1. Mascot Ideation & Animation Engine
- Conceptualize and design a calming, supportive brand mascot.
- This mascot will eventually anchor interactive storytelling, guide users through complex workflows, and become the focal point for new app animations.

### 2. Extended Offerings
- Design for the desktop and web companion portal.
- Design for community integration systems.
- Design for advanced profile tracking details.
