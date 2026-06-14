// A month of living, told in time. The whole ring is your working month — every
// hour you clock in. The recurring SF bill (rent, groceries, utilities…) claims
// its wedges in hours of work; what's left open is yours: free & clear.
//
// Unlike the goods cards, this chart *reshapes* with your pay. A category's hours
// are its dollars ÷ your after-tax wage, so a raise shrinks every wedge and the
// open arc — your free time — grows. That's the whole point made kinetic: earning
// more doesn't just add dollars, it buys hours of your month back.

import { el } from "../dom";
import { effect } from "../store";
import { tweenNumber } from "../tween";
import { netHourlyWageUsd, schedule } from "../state";
import { primaryTime, money } from "../format";
import { MONTHLY_COSTS } from "../data/monthly";

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// Donut geometry. R leaves room for the active wedge to thicken without clipping
// the 200×200 viewBox. GAP is the hairline of track left between wedges.
const R = 80;
const SW = 24;
const C = 2 * Math.PI * R;
const GAP = 0.01; // as a fraction of the full ring

const N = MONTHLY_COSTS.length;
const FREE_I = N; // the "free & clear" remainder lives just past the categories

// Work-minutes in an average month for a given week — the ring's full sweep.
function monthMinutes(hoursPerWeek: number): number {
  return hoursPerWeek > 0 ? ((hoursPerWeek * 52) / 12) * 60 : 0;
}

type Row = { node: HTMLButtonElement; val: HTMLElement; unit: HTMLElement };

export function monthlySection(): HTMLElement {
  // --- The figure: ring + the readout floating in its hole -----------------
  // A faint track shows the full month; colored wedges are drawn onto it each
  // frame, and the free wedge is a calm green that brightens when you ask for it.
  const figure = el("div", "donut-figure");
  const segMarkup = MONTHLY_COSTS.map(
    (c, i) =>
      `<circle class="donut-seg" data-i="${i}" cx="100" cy="100" r="${R}" ` +
      `fill="none" stroke="${c.color}" stroke-width="${SW}" ` +
      `stroke-dasharray="0 ${C.toFixed(2)}" stroke-dashoffset="0" ` +
      `transform="rotate(-90 100 100)" />`,
  ).join("");
  const freeMarkup =
    `<circle class="donut-seg donut-free" data-i="${FREE_I}" cx="100" cy="100" r="${R}" ` +
    `fill="none" stroke-width="${SW}" stroke-dasharray="0 ${C.toFixed(2)}" ` +
    `stroke-dashoffset="0" transform="rotate(-90 100 100)" />`;
  figure.innerHTML =
    `<svg class="donut-svg" viewBox="0 0 200 200" role="img" ` +
    `aria-label="Your working month, split between bills and free time">` +
    `<circle class="donut-track" cx="100" cy="100" r="${R}" fill="none" stroke-width="${SW}" />` +
    `${segMarkup}${freeMarkup}</svg>`;
  const allSegs = Array.from(
    figure.querySelectorAll<SVGCircleElement>(".donut-seg"),
  );
  const essSegs = allSegs.slice(0, N);
  const freeSeg = allSegs[FREE_I];

  const centerVal = el("span", "item-time-value tabular");
  const centerUnit = el("span", "item-time-unit");
  const center = el("div", "item-time is-donut", centerVal, centerUnit);
  const centerCap = el("p", "item-ofwork", "free & clear");
  const share = el("p", "item-practice");
  const shareVal = el("span", "item-practice-value tabular");
  const shareUnit = el("span", "item-practice-unit");
  share.append(shareVal, shareUnit);
  figure.append(el("div", "donut-center", center, centerCap, share));

  // --- The legend: one focusable row per category, then "free & clear" ------
  function makeRow(name: string, detail: string, free = false): Row {
    const swatch = el("span", `donut-swatch${free ? " is-free" : ""}`);
    const val = el("span", "donut-row-value tabular");
    const unit = el("span", "donut-row-unit");
    const node = el(
      "button",
      `donut-row${free ? " is-freerow" : ""}`,
      swatch,
      el(
        "span",
        "donut-row-text",
        el("span", "donut-row-name", name),
        el("span", "donut-row-detail", detail),
      ),
      el("span", "donut-row-time", val, unit),
    ) as HTMLButtonElement;
    node.type = "button";
    return { node, val, unit };
  }
  const rows: Row[] = MONTHLY_COSTS.map((c) =>
    makeRow(c.name, money(c.monthlyUsd)),
  );
  MONTHLY_COSTS.forEach((c, i) => {
    rows[i].node.querySelector<HTMLElement>(".donut-swatch")!.style.background =
      c.color;
  });
  rows.push(makeRow("Free & clear", "what's left after the bills", true));
  const legend = el("div", "donut-legend", ...rows.map((r) => r.node));

  // --- Reactive numbers ----------------------------------------------------
  // shown[i] = labor-minutes currently displayed for category i; we tween each
  // from where it sits toward its target on every wage change. Free time and the
  // ring geometry are *derived* from these every frame, so they morph along.
  const shown = new Array<number>(N).fill(0);
  let empty = true;
  let hover: number | null = null;
  let hpw = 0;

  const freeMinutes = (): number => {
    const month = monthMinutes(hpw);
    const spent = shown.reduce((s, m) => s + m, 0);
    return Math.max(0, month - spent);
  };

  // Redraw the ring from the live minutes: each wedge is its share of the month,
  // clamped so they never spill past a full turn; the gap leaves the track to
  // breathe between them. The leftover sweep is the free wedge.
  function layout(): void {
    const month = monthMinutes(hpw);
    if (empty || month <= 0) {
      for (const s of allSegs) s.setAttribute("stroke-dasharray", `0 ${C}`);
      return;
    }
    let remaining = 1;
    let cum = 0;
    const draw = (seg: SVGCircleElement, frac: number) => {
      const f = Math.max(0, Math.min(frac, remaining));
      const arc = f > 0.0005 ? Math.max(2, (f - GAP) * C) : 0;
      seg.setAttribute("stroke-dasharray", `${arc.toFixed(2)} ${(C - arc).toFixed(2)}`);
      seg.setAttribute("stroke-dashoffset", `${(-cum * C).toFixed(2)}`);
      cum += f;
      remaining -= f;
    };
    for (let i = 0; i < N; i++) draw(essSegs[i], shown[i] / month);
    draw(freeSeg, remaining); // whatever's left of the turn is free
  }

  function paint(): void {
    if (empty) {
      centerVal.textContent = "—";
      centerUnit.textContent = "";
      centerCap.textContent = "free & clear";
      share.classList.add("is-hidden");
      for (const r of rows) {
        r.val.textContent = "—";
        r.unit.textContent = "";
      }
      return;
    }

    const month = monthMinutes(hpw);
    const free = freeMinutes();

    const setTime = (r: Row, minutes: number) => {
      const p = primaryTime(minutes);
      r.val.textContent = p.value;
      r.unit.textContent = ` ${p.unit}`;
    };
    for (let i = 0; i < N; i++) setTime(rows[i], shown[i]);
    setTime(rows[FREE_I], free);

    const idx = hover ?? FREE_I;
    const minutes = idx === FREE_I ? free : shown[idx];
    const p = primaryTime(minutes);
    centerVal.textContent = p.value;
    centerUnit.textContent = ` ${p.unit}`;
    centerCap.textContent =
      idx === FREE_I ? "free & clear" : MONTHLY_COSTS[idx].name;

    const sharePct = month > 0 ? Math.round((minutes / month) * 100) : 0;
    share.classList.remove("is-hidden");
    shareVal.textContent = `${sharePct}%`;
    shareUnit.textContent = "of your month";
  }

  // Highlight one wedge + its legend row (or clear, with null) and refocus the
  // center on it.
  function setActive(i: number | null): void {
    hover = i;
    figure.classList.toggle("is-hovering", i !== null);
    allSegs.forEach((s, k) => s.classList.toggle("is-active", k === i));
    rows.forEach((r, k) => r.node.classList.toggle("is-active", k === i));
    paint();
  }

  const hoverBind = (i: number, node: Element) => {
    node.addEventListener("mouseenter", () => setActive(i));
    node.addEventListener("mouseleave", () => setActive(null));
  };
  allSegs.forEach((s, i) => hoverBind(i, s));
  rows.forEach((r, i) => {
    hoverBind(i, r.node);
    r.node.addEventListener("focus", () => setActive(i));
    r.node.addEventListener("blur", () => setActive(null));
  });

  let cancel: () => void = () => {};
  effect(() => {
    const wage = netHourlyWageUsd();
    hpw = schedule().hoursPerWeek;
    cancel();

    if (wage <= 0 || hpw <= 0) {
      empty = true;
      shown.fill(0);
      layout();
      paint();
      return;
    }
    empty = false;

    const targets = MONTHLY_COSTS.map((c) => (c.monthlyUsd / wage) * 60);
    const from = shown.slice();
    const render = () => {
      layout();
      paint();
    };

    if (reduceMotion) {
      for (let i = 0; i < N; i++) shown[i] = targets[i];
      render();
      return;
    }
    cancel = tweenNumber(0, 1, 620, (t) => {
      for (let i = 0; i < N; i++) shown[i] = from[i] + (targets[i] - from[i]) * t;
      render();
    });
  });

  return el(
    "div",
    "monthly fade-in",
    el(
      "header",
      "items-intro",
      el("p", "items-eyebrow", "Where the month goes"),
      el("h2", "items-title", "How much of your month is yours?"),
      el(
        "p",
        "items-note",
        "Your whole working month, drawn as a ring. The standing bill of a single person in " +
          "San Francisco — typical, rounded — claims its wedges in hours. What stays open is free " +
          "& clear, and a raise makes it grow.",
      ),
    ),
    el("div", "donut-grid", figure, legend),
  );
}
