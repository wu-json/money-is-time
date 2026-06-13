---
status: draft
---

# Money is Time — Cost-as-Time SPA

A single-page UI/UX experiment that reframes the price of everyday goods as
**time you have to work** instead of money. You enter your annual salary and
your work schedule; the page translates the cost of a curated list of goods
(coffee, rent, a car, …) into days / hours / minutes of labor. At the bottom,
the same goods are shown through the lens of someone obscenely wealthy (e.g.
Elon Musk) so you can feel the delta in what time is "worth" across the wealth
spectrum.

## Goals

- Make the abstract idea "money = time" viscerally obvious in <10 seconds.
- Pure client-side, single page, no backend.
- Fast and performant: instant recalculation as you type, smooth animations.
- Lightweight stack — **TypeScript + Bun**, no React/Vue/Svelte. Hand-rolled
  reactivity small enough to read in one sitting.
- Easy to animate: state changes drive plain DOM/CSS, numbers tween cleanly.

## Non-goals

- No accounts, persistence-to-server, or analytics.
- Not financial advice; comparison figures are illustrative, not audited.
- No mobile-app build, no SSR, no routing (it's one page).
- No exhaustive goods catalog — a tasteful, hardcoded starter set is enough.

## Tech stack & rationale

| Concern | Choice | Why |
|---|---|---|
| Runtime / tooling | **Bun** | One tool for install, dev server, bundler, TS transpile. Zero config, very fast. |
| Language | **TypeScript** | Type-safe calc/format logic; catches unit-conversion mistakes. |
| UI | **Vanilla DOM + tiny signal store** | No framework weight. Direct text-node updates = trivially fast and trivially animatable. |
| Styling | **Plain CSS** (one stylesheet) | CSS transitions/transforms handle most animation; JS only for number tweens. |
| Build | `bun build ./src/main.ts` | Single bundled JS file referenced by `index.html`. |

### Why a hand-rolled signal store instead of React

The entire app is "a few inputs fan out to many derived numbers." That's the
textbook case for fine-grained reactivity. We implement ~40 lines of signal /
computed / effect and update only the text nodes that changed. No reconciler, no
hydration, no bundle bloat — and number tweening is just an `effect` driving
`requestAnimationFrame`.

## Core model & math

All money→time conversion funnels through a few pure functions (`src/calc.ts`)
so the logic is testable and unambiguous.

```ts
// Inputs
type Schedule = {
  hoursPerWeek: number;   // total hours worked / week
  daysPerWeek: number;    // working days / week (used to define a "work day")
};

const WEEKS_PER_YEAR = 52;

// Derived
hourlyWage      = annualSalary / (hoursPerWeek * WEEKS_PER_YEAR);
workHoursPerDay = hoursPerWeek / daysPerWeek;

// Cost of a good, in *hours of labor*
laborHours(price) = price / hourlyWage;
```

### Days / hours / minutes — which "day"?

The compelling framing is **"how long must you work to afford this,"** so a
"day" means a **working day**, not 24 calendar hours. A 996 worker's day is 12h;
a 9-to-5 worker's day is 8h. This makes the schedule presets meaningfully change
the output, which is the point of the experiment.

```ts
format(laborHours, workHoursPerDay) -> { days, hours, minutes }
// days    = floor(laborHours / workHoursPerDay)
// hours   = floor(remaining hours)
// minutes = round(remaining minutes)
```

We render the largest two non-zero units (e.g. "3 days 4 hrs", or "12 min")
to keep cards scannable. Exact behavior tunable during the rip.

### Schedule presets

| Preset | Meaning | hoursPerWeek | daysPerWeek |
|---|---|---|---|
| **9 to 5** | 8h × 5 days | 40 | 5 |
| **996** | 9am–9pm, 6 days | 72 | 6 |
| **9127 (founder mode)** | 9am–1am, 7 days (16h × 7) | 112 | 7 |
| **Custom** | user-entered | user | user |

Selecting a preset fills the schedule fields; the user can still override into
Custom.

### Comparison personas

A persona is just "someone with a known effective earning rate." We store an
effective **hourly rate** (or net-worth-growth rate reduced to per-hour) and run
the *same* goods through it.

```ts
type Persona = {
  id: string;
  name: string;          // "Elon Musk"
  blurb: string;         // illustrative source note
  effectiveHourlyUsd: number;
};
```

Figures are explicitly labeled illustrative (wealth ≠ salary; net-worth swings
are volatile). The delta we surface per good: *your* time vs *their* time —
e.g. "Rent costs you **4 days**; it costs Elon **0.6 seconds**." The dramatic
unit collapse (days → seconds) is the emotional payload.

## Project structure

```
money-is-time/
  index.html              # shell: header, mount points, <script> to bundle
  package.json
  tsconfig.json
  src/
    main.ts               # boot: read defaults, wire components, first render
    store.ts              # ~40-line signal / computed / effect
    calc.ts               # pure money<->time math
    format.ts             # laborHours -> {days,hours,minutes} + display strings
    tween.ts              # rAF number tween helper (for animated counts)
    state.ts              # app signals: salary, schedule, selected persona
    data/
      items.ts            # catalog of goods (name, emoji/icon, priceUsd)
      personas.ts         # comparison personas
    components/
      salaryInput.ts
      scheduleSelector.ts # presets + custom fields
      itemCard.ts
      comparison.ts
    styles.css
```

## Implementation plan

### Phase 1 — Page scaffolding

**Outcome:** `bun dev` serves a styled, empty single page with a working signal
store and render pipeline; no real inputs yet.

1. `bun init`; add `tsconfig.json`; scripts in `package.json`:
   - `dev`: `bun build ./src/main.ts --outdir dist --watch` + a static serve
     (Bun's built-in server in `main` dev harness, or `bunx serve dist`).
   - `build`: `bun build ./src/main.ts --outdir dist --minify`.
2. `index.html` shell: header/title, a `<main>` with placeholder mount nodes
   (`#controls`, `#items`, `#comparison`), single `<link>` to `styles.css`,
   single `<script type="module" src="/main.js">`.
3. `store.ts`: implement `signal`, `computed`, `effect`. Keep it dependency-free
   and tiny; this is the spine everything else hangs off.
4. `styles.css`: base layout (centered column, max-width), typography, color
   tokens (CSS custom properties), a couple of utility transition classes.
5. `main.ts`: prove the loop end-to-end — a signal whose value renders into the
   DOM via an `effect`, updating live (temporary debug control is fine).

**Done when:** editing a signal updates the DOM with no full re-render, and the
page looks intentional (not a white box).

### Phase 2 — Input forms (salary + schedule)

**Outcome:** the two real inputs drive `hourlyWage` / `workHoursPerDay`.

1. `state.ts`: `salary` (signal, sensible default e.g. 75000), `schedule`
   (signal: `{hoursPerWeek, daysPerWeek, presetId}`), and `computed`
   `hourlyWage`, `workHoursPerDay`.
2. `calc.ts`: pure functions above, with guards (salary ≤ 0, hours ≤ 0 → show a
   gentle empty/invalid state instead of `Infinity`/`NaN`).
3. `components/salaryInput.ts`: number input, formatted (thousands separators on
   blur), debounced wiring to the `salary` signal.
4. `components/scheduleSelector.ts`: segmented control of presets (9to5 / 996 /
   9127 / Custom). Selecting a preset writes both fields; editing fields flips to
   Custom. Show the derived `hourlyWage` somewhere small as feedback.

**Done when:** changing salary or preset instantly changes derived numbers, and
bad input degrades gracefully.

### Phase 3 — Initial items (goods as time)

**Outcome:** a grid of goods, each showing its cost in days/hours/minutes,
recomputing + animating as inputs change.

1. `data/items.ts`: starter catalog with `priceUsd`, label, emoji/icon — e.g.
   Coffee ($5), Lunch ($15), Monthly rent ($2000), iPhone ($1000), Used car
   ($25000), Median US home ($420000). Tune for a satisfying spread of units.
2. `format.ts`: `laborHours -> {days,hours,minutes}` using `workHoursPerDay`,
   plus a `displayString` that shows the top two non-zero units.
3. `tween.ts`: rAF helper that animates a number from old→new over ~300ms with
   easing; used so card values *count* to their new value on input change.
4. `components/itemCard.ts`: renders one good; an `effect` recomputes its time
   from `hourlyWage` + `workHoursPerDay` and drives the tween. Subtle
   enter/update animation (scale/opacity via CSS).
5. Render the grid into `#items` from the catalog.

**Done when:** all cards live-update and tween smoothly when salary/schedule
change; units read naturally across the price range.

### Phase 4 — Wealth comparison

**Outcome:** a closing section contrasting *your* time-cost vs a wealthy
persona's for the same goods, dramatizing the delta.

1. `data/personas.ts`: 1–3 personas (Musk + maybe one mid-tier) with
   `effectiveHourlyUsd` and an illustrative blurb. Persona selector if >1.
2. Extend `format.ts` to render very small durations gracefully (seconds,
   fractions of a second) since the wealthy column collapses hard.
3. `components/comparison.ts`: for each good, a paired row — "You: 4 days" vs
   "Elon: 0.6 s" — with a visual delta (bar ratio, or an emphatic multiplier
   like "≈ 50,000× faster"). Reuse `calc`/`format`; just swap the hourly rate.
4. Animate the reveal (stagger rows in) and re-tween on input change.
5. Copy/footnote: clearly mark figures as illustrative.

**Done when:** the comparison reads as a punchline, updates with your inputs, and
the wealth delta is unmistakable.

## Open questions / decisions to confirm during rip

- **Work-day vs calendar-day basis** — spec assumes *work day*. Confirm this is
  the framing we want (alternative: 24h calendar days for a "fraction of your
  life" angle).
- **Persona numbers** — pick a defensible illustrative `effectiveHourlyUsd` for
  Musk (net-worth-growth-per-hour vs nominal salary) and cite the basis in the
  blurb.
- **Default salary/preset** — what loads on first paint (proposed: $75k, 9-to-5).
- **Dev serve mechanism** — Bun.serve harness vs `bunx serve`; pick the simplest
  that supports live reload.
