// Phase 3 — goods as time. Renders the catalog as a narrative sequence of
// cards, each in its own visual register (a thin coffee ribbon up to a
// full-bleed car hero). Every card's time-cost recomputes from the live hourly
// wage and *counts* to its new value when you change salary or hours.

import { el } from "../dom";
import { effect } from "../store";
import { tweenNumber } from "../tween";
import { hourlyWageUsd, schedule } from "../state";
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

// The shared time readout: a big tabular number, its unit, and an optional
// secondary unit ("· 4 days"). Size is set by the modifier class.
function timeView(modifier: string) {
  const node = el("div", `item-time ${modifier}`);
  const val = el("span", "item-time-value tabular");
  const unit = el("span", "item-time-unit");
  const sec = el("span", "item-time-sec tabular");
  node.append(val, unit, sec);

  const set = (info: TimeInfo) => {
    if (!info) {
      node.classList.add("is-empty");
      val.textContent = "—";
      unit.textContent = "";
      sec.textContent = "";
      return;
    }
    node.classList.remove("is-empty");
    const [p, s] = info.parts;
    val.textContent = String(p.value);
    unit.textContent = ` ${p.unit}`;
    sec.textContent = s ? ` · ${s.value} ${s.unit}` : "";
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
    el("p", "item-name", `${item.name} · ${item.place} · ${money(item.priceUsd)}`),
  );
  const time = timeView("is-inline");
  const right = el(
    "div",
    "item-ribbon-right",
    time.node,
    el("span", "item-ofwork", "of work"),
  );
  const node = el("article", "item item-ribbon fade-in", iconEl(item.icon), text, right);
  return { node, update: time.set };
}

// 2 & 3) Brunch / DoorDash — standard vertical cards, sat side by side.
function card(item: Item): Built {
  const time = timeView("is-big");
  const node = el(
    "article",
    "item item-card fade-in",
    iconEl(item.icon),
    el("p", "item-prompt", item.prompt),
    el("p", "item-name", item.name, el("span", "item-place", ` ${item.place}`)),
    time.node,
    el("p", "item-ofwork", `of work · ${money(item.priceUsd)}`),
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
    "item item-feature fade-in",
    el(
      "div",
      "item-feature-head",
      iconEl(item.icon),
      el(
        "div",
        "item-feature-titles",
        el("p", "item-prompt", item.prompt),
        el("p", "item-name", `${item.name} · ${item.place} · ${money(item.priceUsd)}`),
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
    barLabel.textContent = `${Math.round(ratio * 100)}% of everything you earn this month`;
  };
  return { node, update };
}

// 5) Car — the closer. One enormous number, full bleed.
function hero(item: Item): Built {
  const time = timeView("is-hero");
  const foot = el("p", "item-ofwork");
  const node = el(
    "article",
    "item item-hero fade-in",
    iconEl(item.icon, "is-lg"),
    el("p", "item-prompt", item.prompt),
    el("p", "item-name", `${item.name} · ${money(item.priceUsd)}`),
    time.node,
    foot,
  );

  const update = (info: TimeInfo) => {
    time.set(info);
    const perMonth = workMinutesPerMonth();
    if (!info || perMonth <= 0) {
      foot.textContent = "of work";
      return;
    }
    const months = info.minutes / perMonth;
    foot.textContent =
      months >= 1.5
        ? `of work — about ${Math.round(months)} months of your working life`
        : "of work";
  };
  return { node, update };
}

function build(item: Item): Built {
  switch (item.variant) {
    case "ribbon":
      return ribbon(item);
    case "feature":
      return feature(item);
    case "hero":
      return hero(item);
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
    const wage = hourlyWageUsd();
    cancel();
    if (wage <= 0) {
      render(null);
      return;
    }
    const target = (price / wage) * 60; // minutes of labor
    if (reduceMotion) {
      shown = target;
      render({ parts: timeParts(target), minutes: target });
      return;
    }
    cancel = tweenNumber(shown, target, 520, (m) => {
      shown = m;
      render({ parts: timeParts(m), minutes: m });
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
    ),
  );

  // Lay out in catalog order, grouping consecutive "card" variants into a pair.
  let i = 0;
  while (i < ITEMS.length) {
    if (ITEMS[i].variant === "card") {
      const pair = el("div", "item-pair");
      while (i < ITEMS.length && ITEMS[i].variant === "card") {
        const built = build(ITEMS[i]);
        wire(ITEMS[i].priceUsd, built.update);
        pair.append(built.node);
        i++;
      }
      stack.append(pair);
    } else {
      const built = build(ITEMS[i]);
      wire(ITEMS[i].priceUsd, built.update);
      stack.append(built.node);
      i++;
    }
  }

  return stack;
}
