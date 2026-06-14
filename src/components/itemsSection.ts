// Phase 3 — goods as time. Renders the catalog as a narrative sequence of
// cards, each in its own visual register (a thin coffee ribbon up to a
// full-bleed car hero). Every card's time-cost recomputes from the live hourly
// wage and *counts* to its new value when you change salary or hours.

import { el } from "../dom";
import { effect } from "../store";
import { tweenNumber } from "../tween";
import { hourlyWageUsd, netHourlyWageUsd, salary, schedule } from "../state";
import { federalIncomeTax, californiaIncomeTax } from "../calc";
import { timeParts, money, type TimePart } from "../format";
import { ITEMS, type Item } from "../data/items";

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// What the time number resolves to, frame by frame. `null` = no valid wage yet
// (salary or hours at 0), which cards render as a gentle placeholder.
type TimeInfo = { parts: TimePart[]; minutes: number } | null;

// Minutes the user works in an average month — the denominator for "share of
// your month" visuals. Read outside an effect (no subscription needed): the
// wiring effect already re-runs whenever the wage changes.
function workMinutesPerMonth(): number {
  const h = schedule().hoursPerWeek;
  return h > 0 ? ((h * 52) / 12) * 60 : 0;
}

function iconEl(svg: string, extra = ""): HTMLElement {
  const span = el("span", `item-icon ${extra}`.trim());
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = svg;
  return span;
}

// The shared time readout: one big tabular number and its unit. We show only
// the dominant unit ("12 weeks", "5 min") — punchier, and no middot to misread
// as a decimal. Size is set by the modifier class.
function timeView(modifier: string) {
  const node = el("div", `item-time ${modifier}`);
  const val = el("span", "item-time-value tabular");
  const unit = el("span", "item-time-unit");
  node.append(val, unit);

  const set = (info: TimeInfo) => {
    if (!info) {
      node.classList.add("is-empty");
      val.textContent = "—";
      unit.textContent = "";
      return;
    }
    node.classList.remove("is-empty");
    const [p] = info.parts;
    val.textContent = String(p.value);
    unit.textContent = ` ${p.unit}`;
  };

  return { node, set };
}

type Built = { node: HTMLElement; update: (info: TimeInfo) => void };

// 1) Coffee — a slim full-width ribbon: cheap things shouldn't shout.
function ribbon(item: Item): Built {
  const text = el(
    "div",
    "item-ribbon-text",
    el("p", "item-prompt", item.prompt),
    el("p", "item-name", `${item.name} · ${item.place} · ${money(item.priceUsd ?? 0)}`),
  );
  const time = timeView("is-inline");
  const right = el(
    "div",
    "item-ribbon-right",
    time.node,
    el("span", "item-ofwork", "of work"),
  );
  const node = el("article", "item item-ribbon", iconEl(item.icon), text, right);
  return { node, update: time.set };
}

// 2 & 3) Brunch / DoorDash — standard vertical cards, sat side by side.
function card(item: Item): Built {
  const time = timeView("is-big");
  const node = el(
    "article",
    "item item-card",
    iconEl(item.icon),
    el("p", "item-prompt", item.prompt),
    el("p", "item-name", item.name, el("span", "item-place", ` ${item.place}`)),
    time.node,
    el("p", "item-ofwork", `of work · ${money(item.priceUsd ?? 0)}`),
  );
  if (item.note) node.append(el("p", "item-note", item.note));
  return { node, update: time.set };
}

// 4) Rent — a feature panel with a bar showing the share of your working month
// the rent swallows.
function feature(item: Item): Built {
  const time = timeView("is-big");
  const fill = el("div", "item-bar-fill");
  const bar = el("div", "item-bar", fill);
  const barLabel = el("p", "item-bar-label");
  const node = el(
    "article",
    "item item-feature",
    el(
      "div",
      "item-feature-head",
      iconEl(item.icon),
      el(
        "div",
        "item-feature-titles",
        el("p", "item-prompt", item.prompt),
        el("p", "item-name", `${item.name} · ${item.place} · ${money(item.priceUsd ?? 0)}`),
      ),
    ),
    el("div", "item-feature-time", time.node, el("span", "item-ofwork", "of work, every month")),
    bar,
    barLabel,
  );

  const update = (info: TimeInfo) => {
    time.set(info);
    const perMonth = workMinutesPerMonth();
    if (!info || perMonth <= 0) {
      fill.style.width = "0%";
      barLabel.textContent = "";
      return;
    }
    const ratio = Math.min(1, info.minutes / perMonth);
    fill.style.width = `${(ratio * 100).toFixed(1)}%`;
    barLabel.textContent = `${Math.round(ratio * 100)}% of your take-home this month`;
  };
  return { node, update };
}

// 5) Car — the closer. One enormous number, full bleed.
function hero(item: Item): Built {
  const time = timeView("is-hero");
  const node = el(
    "article",
    "item item-hero",
    iconEl(item.icon, "is-lg"),
    el("p", "item-prompt", item.prompt),
    el("p", "item-name", `${item.name} · ${money(item.priceUsd ?? 0)}`),
    time.node,
    el("p", "item-ofwork", "of work"),
  );
  return { node, update: time.set };
}

// The calendar day you'd stop "working for the government" if every dollar from
// Jan 1 went to taxes first — the Tax-Freedom-Day framing.
function freedomDate(rate: number): string {
  const dayOfYear = Math.min(365, Math.max(1, Math.round(rate * 365)));
  const d = new Date(2025, 0, 1);
  d.setDate(d.getDate() + dayOfYear - 1);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// Taxes — like the rent feature, but the "price" is computed from salary and
// the bar splits into federal vs. California. Self-wired (multiple reactive
// numbers), so it skips the generic wire().
function taxCard(item: Item): HTMLElement {
  const time = timeView("is-big");
  const fed = el("div", "tax-seg tax-seg-fed");
  const state = el("div", "tax-seg tax-seg-state");
  const bar = el("div", "item-bar tax-bar", fed, state);
  const breakdown = el("p", "item-name tax-breakdown");
  const dateLabel = el("p", "item-bar-label");

  const node = el(
    "article",
    "item item-feature item-tax",
    el(
      "div",
      "item-feature-head",
      iconEl(item.icon),
      el(
        "div",
        "item-feature-titles",
        el("p", "item-prompt", item.prompt),
        el("p", "item-name", `${item.name} · ${item.place}`),
      ),
    ),
    el("div", "item-feature-time", time.node, el("span", "item-ofwork", "of work a year")),
    bar,
    breakdown,
    dateLabel,
  );
  if (item.note) node.append(el("p", "item-note", item.note));

  const dot = (cls: string) => el("span", `tax-dot ${cls}`);

  let shown = 0;
  let cancel: () => void = () => {};
  effect(() => {
    const pay = salary();
    const wage = hourlyWageUsd();
    const hpw = schedule().hoursPerWeek;
    const fedTax = federalIncomeTax(pay);
    const stateTax = californiaIncomeTax(pay);
    const total = fedTax + stateTax;
    cancel();

    if (wage <= 0 || pay <= 0 || total <= 0) {
      time.set(null);
      fed.style.width = "0%";
      state.style.width = "0%";
      breakdown.textContent = "";
      dateLabel.textContent = "";
      return;
    }

    const rate = total / pay;
    fed.style.width = `${((fedTax / pay) * 100).toFixed(1)}%`;
    state.style.width = `${((stateTax / pay) * 100).toFixed(1)}%`;
    breakdown.replaceChildren(
      dot("is-fed"),
      ` Federal ${money(Math.round(fedTax))} `,
      dot("is-state"),
      ` California ${money(Math.round(stateTax))} · ~${Math.round(rate * 100)}% of your pay`,
    );
    dateLabel.textContent = `You work until ${freedomDate(rate)} just to cover it.`;

    const target = (total / wage) * 60;
    if (reduceMotion) {
      shown = target;
      time.set({ parts: timeParts(target, hpw), minutes: target });
      return;
    }
    cancel = tweenNumber(shown, target, 520, (m) => {
      shown = m;
      time.set({ parts: timeParts(m, hpw), minutes: m });
    });
  });

  return node;
}

// 6 & 7) Life milestones — a ledger-like row with the time (now in years) on
// the left and a provocative aside on the right. Distinct from the centered car
// hero so the escalation reads as its own beat.
function milestone(item: Item): Built {
  const time = timeView("is-mile");
  const figure = el(
    "div",
    "item-milestone-figure",
    time.node,
    el("span", "item-ofwork", "of work"),
  );
  const text = el(
    "div",
    "item-milestone-text",
    el("div", "item-milestone-head", iconEl(item.icon), el("p", "item-prompt", item.prompt)),
    el("p", "item-name", `${item.name} · ${money(item.priceUsd ?? 0)}`),
  );
  if (item.note) text.append(el("p", "item-note", item.note));
  const node = el("article", "item item-milestone", figure, text);
  return { node, update: time.set };
}

function build(item: Item): Built {
  switch (item.variant) {
    case "ribbon":
      return ribbon(item);
    case "feature":
      return feature(item);
    case "hero":
      return hero(item);
    case "milestone":
      return milestone(item);
    default:
      return card(item);
  }
}

// Drive a card's time number: recompute the target from the live wage and tween
// toward it (interruptibly), or hand back null when there's no valid wage.
function wire(price: number, render: (info: TimeInfo) => void): void {
  let shown = 0;
  let cancel: () => void = () => {};
  effect(() => {
    const wage = netHourlyWageUsd();
    const hpw = schedule().hoursPerWeek;
    cancel();
    if (wage <= 0) {
      render(null);
      return;
    }
    const target = (price / wage) * 60; // minutes of labor (after-tax wage)
    if (reduceMotion) {
      shown = target;
      render({ parts: timeParts(target, hpw), minutes: target });
      return;
    }
    cancel = tweenNumber(shown, target, 520, (m) => {
      shown = m;
      render({ parts: timeParts(m, hpw), minutes: m });
    });
  });
}

export function itemsSection(): HTMLElement {
  const stack = el(
    "div",
    "items",
    el(
      "header",
      "items-intro",
      el("p", "items-eyebrow", "Same prices, told in time"),
      el("h2", "items-title", "So… what can you actually afford?"),
      el(
        "p",
        "items-note",
        "Counted in take-home pay — the hours you'd work after federal and California income tax.",
      ),
    ),
  );

  // Lay out in catalog order, grouping consecutive "card" variants into a pair.
  let i = 0;
  while (i < ITEMS.length) {
    const item = ITEMS[i];
    if (item.variant === "tax") {
      stack.append(taxCard(item)); // self-wired
      i++;
    } else if (item.variant === "card") {
      const pair = el("div", "item-pair");
      while (i < ITEMS.length && ITEMS[i].variant === "card") {
        const built = build(ITEMS[i]);
        wire(ITEMS[i].priceUsd ?? 0, built.update);
        pair.append(built.node);
        i++;
      }
      stack.append(pair);
    } else {
      const built = build(item);
      wire(item.priceUsd ?? 0, built.update);
      stack.append(built.node);
      i++;
    }
  }

  return stack;
}
