# Recovery Compass: UI/UX Design Handover & Phase Plan

  

Welcome to the team! Recovery Compass is a guided behavior-change and regulation app focused on calm, structured support for habits, sleep, energy, and daily balance.

  

As we gear up for our **Phase 1 Launch on April 20th**, we have structured our design roadmap to prioritize the core user experience immediately, followed by deeper system redesigns and brand expansion in subsequent phases.

  

---

  

## The Design Philosophy

Before diving into the phases, please align all designs with our established brand identity.

* **The Vibe:** Calm, grounded, compassionate, and editorial. "Warm luxury."

* **Color Palette:** Light theme default. Use deep forest green (`#06290C`) for authority, sage glaze (`#E3F3E5`) for backgrounds, and warm, tactile off-whites (linen, oat, stone). **Avoid:** Flashy startup gradients, neons, or sterile whites.

* **Typography:** We currently use a combination of an editorial serif for emotional headings and a sans-serif for utility (Satoshi). We are looking to update our serif font to something that maintains this premium printed feel.

* **Layout:** Generous whitespace, asymmetric but controlled composition, soft borders. Avoid dense, cluttered dashboards or overly glossy "glassmorphism".

  

## Technical Constraints (For Figma Hand-offs)

* Our app is built in **React Native (Expo)** using **NativeWind** (Tailwind CSS styling).

* For gradients, we rely on standard linear background sweeps.

* For micro-animations, we use `react-native-reanimated`. In Phase 1, stick to standard transitions (fade, slide) and spring interactions (tap-to-scale). Avoid highly complex SVG morphs right before launch.

  

---

  

## Phase 1: Core Product & Launch Polish (Priority - Due April 19)

*We need to ensure the app is stable, cohesive, and looks professionally finished the moment early users open it for our launch on the 20th.*

  

### 1. Typography Swap

* Select and implement a replacement for our current heading font (Erode) that better fits the "warm luxury / editorial" vibe.

  

### 2. Gradient & Color Polish

* Define and integrate subtle, tactile background gradients across existing cards and layout structures.

  

### 3. Core Tab Redesign (Highest Priority)

Completely redesign the 4 main application tabs that users interact with daily:

* **Home:** Dashboard, today's focus, and quick actions.

* **Program:** List of the user's purchased content/programs.

* **Routine:** Coach-assigned daily schedule view.

* **Profile:** Settings, progress, and account recovery.

  

### 4. In-Program Card Redesign

* High-fidelity redesign of the daily reading/exercise cards (the "Swipe-Through" day view). Since this is the core content users are paying for, it must feel deeply premium, readable, and highly polished on day one.

  

### 5. Foundational Micro-Animations

* Define the core interactive feedback system: fast, subtle button tap-scales, screen-to-screen transitions, and modal appearances.

  

---

  

## Phase 2: Acquisition & Conversion Overhaul (Post-Launch)

*After launch operations stabilize, focus shifts to the flows that drive conversions, trust, and deep engagement.*

  

### 1. Interactive Breathing & CALM Overhaul (Highest Priority)

* Designing custom, complex animations for the 10-minute full-screen CALM breathing modal and day-completion success sequences. This is the flagship interactive feature of the app.

  

### 2. Onboarding & Adaptive Questionnaire

* A full visual overhaul of the 10-step personalization flow. It must feel untraditional, deeply personal, and highly trustworthy as it builds the user's plan.

  

### 3. Premium Paywalls

* High-fidelity redesigns of the purchase screens and program upsells, optimizing for one-time unlocks.

  

---

  

## Phase 3: Brand Identity Expansion & Complex Systems (Future)

*Expanding the platform and deepening the brand connection.*

  

### 1. Mascot Ideation & Animation Engine

* Conceptualize and design a calming, supportive brand Mascot.

* This mascot will eventually serve as the anchor for interactive storytelling, guiding the user through complex workflows and serving as the focal point for new app animations.

  

### 2. Extended Offerings

* Design for the Desktop/Web companion portal, community integration systems, and advanced profile tracking details.