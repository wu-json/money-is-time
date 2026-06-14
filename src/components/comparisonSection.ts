// Whose hour is worth more? Pick a famous earner and weigh your hourly against
// theirs. Everyone's annual figure is put on the same full-time clock (see
// ../data/people), then the verdict speaks the gap two ways: a bare multiplier,
// and the labor-time it implies — how long you'd work to earn one of their
// hours (or they, one of yours). Reactive to your salary and schedule, so the
// gap breathes as you change them.

import { el } from "../dom";
import { effect } from "../store";
import { tweenNumber } from "../tween";
import { hourlyWageUsd, schedule } from "../state";
import { primaryTime, laborWeeks, money, type Primary } from "../format";
import { PEOPLE, STANDARD_WORK_HOURS, type Person } from "../data/people";

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// Multiplier: one decimal under ten, grouped integers to five figures, then
// compact (12.3K, 4.6M, 1.1B) so a billionaire's number still fits a line.
function fmtMult(n: number): string {
  if (n < 10) return String(Math.round(n * 10) / 10);
  if (n < 100_000) return Math.round(n).toLocaleString("en-US");
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.round(n));
}

// An hourly rate: cents only when the number is small enough to want them.
function rate(n: number): string {
  return n < 1000 ? money(n) : money(Math.round(n));
}

// Labor-time readout: work-weeks/years once it's a week or more, else raw hours.
function timeReadout(hours: number, hoursPerWeek: number): Primary {
  const minutes = Math.max(0, hours) * 60;
  const weeks = hoursPerWeek > 0 ? minutes / 60 / hoursPerWeek : 0;
  return weeks >= 1 ? laborWeeks(minutes, hoursPerWeek) : primaryTime(minutes);
}

const DEFAULT_ID = "lebron";

export function comparisonSection(): HTMLElement {
  // --- Selector ------------------------------------------------------------
  const chips = PEOPLE.map((p) => {
    const btn = el("button", "compare-chip", p.name) as HTMLButtonElement;
    btn.type = "button";
    btn.addEventListener("click", () => select(p));
    return { person: p, btn };
  });
  const people = el("div", "compare-people", ...chips.map((c) => c.btn));

  // --- Rates row -----------------------------------------------------------
  const yourRate = el("span", "compare-side-rate tabular", "—");
  const youSide = el(
    "div",
    "compare-side",
    el("span", "compare-side-label", "Your hour"),
    yourRate,
    el("span", "compare-side-cap", "after your salary & schedule"),
  );

  const theirRate = el("span", "compare-side-rate tabular", "—");
  const theirName = el("span", "compare-side-label", "");
  const theirCap = el("span", "compare-side-cap", "");
  const themSide = el(
    "div",
    "compare-side is-them",
    theirName,
    theirRate,
    theirCap,
  );

  const rates = el(
    "div",
    "compare-rates",
    youSide,
    el("span", "compare-vs", "vs"),
    themSide,
  );

  // --- Verdict -------------------------------------------------------------
  const lead = el("p", "compare-lead", "");
  const multValue = el("span", "compare-mult-value tabular", "—");
  const mult = el("p", "compare-mult", multValue, el("span", "compare-mult-x", "×"));
  const subPre = document.createTextNode("");
  const subTimeVal = el("b", "tabular", "");
  const subTimeUnit = el("span", "");
  const subPost = document.createTextNode("");
  const sub = el("p", "compare-sub", subPre, subTimeVal, " ", subTimeUnit, subPost);
  const verdict = el("div", "compare-verdict", lead, mult, sub);

  const card = el("div", "compare-card", rates, verdict);

  // --- State + rendering ---------------------------------------------------
  let selected: Person =
    PEOPLE.find((p) => p.id === DEFAULT_ID) ?? PEOPLE[PEOPLE.length - 1];
  let userHourly = 0;
  let hpw = 40;
  let shownMult = 0;
  let cancel: () => void = () => {};

  function paintMult(value: number): void {
    multValue.textContent = fmtMult(value);
  }

  function render(): void {
    for (const c of chips) {
      const active = c.person.id === selected.id;
      c.btn.classList.toggle("is-active", active);
      c.btn.setAttribute("aria-pressed", String(active));
    }

    theirName.textContent = selected.name;
    theirCap.textContent = selected.note ?? selected.role;

    cancel();

    if (userHourly <= 0) {
      verdict.classList.add("is-empty");
      yourRate.textContent = "—";
      theirRate.textContent = "—";
      lead.textContent = "Set your salary above to see how your hour compares.";
      mult.classList.add("is-hidden");
      sub.classList.add("is-hidden");
      return;
    }
    verdict.classList.remove("is-empty");
    mult.classList.remove("is-hidden");
    sub.classList.remove("is-hidden");

    const personHourly = selected.annualUsd / STANDARD_WORK_HOURS;
    yourRate.textContent = rate(userHourly);
    theirRate.textContent = rate(personHourly);

    const ratio = personHourly / userHourly;
    const theyEarnMore = ratio >= 1;
    const targetMult = theyEarnMore ? ratio : 1 / ratio;

    // Hours of labor to earn ONE of the higher earner's hours, told in the
    // lower earner's own schedule.
    const hoursToMatch = targetMult;
    const t = timeReadout(hoursToMatch, theyEarnMore ? hpw : 40);

    if (theyEarnMore) {
      lead.textContent = `${selected.name}'s hour is worth`;
      subPre.textContent = "You'd work ";
      subPost.textContent = ` to earn what they make in a single hour.`;
    } else {
      lead.textContent = "Your hour is worth";
      subPre.textContent = `${selected.name} would work `;
      subPost.textContent = ` to earn what you make in a single hour.`;
    }
    subTimeVal.textContent = t.value;
    subTimeUnit.textContent = t.unit;

    if (reduceMotion) {
      shownMult = targetMult;
      paintMult(shownMult);
      return;
    }
    cancel = tweenNumber(shownMult, targetMult, 620, (v) => {
      shownMult = v;
      paintMult(v);
    });
  }

  function select(p: Person): void {
    if (p.id === selected.id) return;
    selected = p;
    render();
  }

  // Re-render whenever the user's hourly (salary ÷ schedule) changes.
  effect(() => {
    userHourly = hourlyWageUsd();
    hpw = schedule().hoursPerWeek || 40;
    render();
  });

  return el(
    "div",
    "compare",
    el(
      "header",
      "items-intro",
      el("p", "items-eyebrow", "Whose hour is worth more?"),
      el("h2", "items-title", "How does your time compare?"),
      el(
        "p",
        "items-note",
        "Everyone's pay, put on the same full-time clock. Pick someone and see " +
          "the gap — as a plain multiple, and as the hours you'd trade to match it.",
      ),
    ),
    people,
    card,
  );
}
