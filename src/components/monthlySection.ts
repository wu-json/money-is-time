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

// Calendar days in an average month — the canvas the freedom-day story is told on.
const DAYS_PER_MONTH = 365.25 / 12; // ≈ 30.44

// "1st", "2nd", "3rd", "19th", "21st" — the freedom-day reads as a date, not a stat.
function ordinal(n: number): string {
  const v = n % 100;
  const suffix =
    v >= 11 && v <= 13
      ? "th"
      : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

// The whole point, in one struct: map the bills' share of your *working* month onto
// the calendar. `freedomDay` is the day you stop covering bills and start earning for
// yourself; `daysYours` is how much of the month that leaves you. The fraction comes
// from labor-time (dollars ÷ wage), spread evenly across the days.
function freedom(freeMin: number, monthMin: number) {
  const freeFrac = monthMin > 0 ? Math.max(0, Math.min(1, freeMin / monthMin)) : 0;
  const daysYours = Math.round(freeFrac * DAYS_PER_MONTH);
  const billDays = DAYS_PER_MONTH - freeFrac * DAYS_PER_MONTH;
  const freedomDay = Math.min(31, Math.floor(billDays) + 1);
  return { daysYours, freedomDay };
}

type Row = { node: HTMLButtonElement; val: HTMLElement; unit: HTMLElement };

export function monthlySection(): HTMLElement {
  // The dynamic punch line under the heading — rewritten on every wage change to
  // name the day you stop working for the bills and start working for yourself.
  const lede = el("p", "items-lede");

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
  rows.push(makeRow("Yours, free & clear", "the days you work for yourself", true));
  const legend = el("div", "donut-legend", ...rows.map((r) => r.node));

  // --- The calendar: the same story laid on a month --------------------------
  // Before the ring, we draw the month as days. The bills claim a grey run at the
  // start; the freedom day is the deep-green turn; everything after is yours. The
  // grid is exactly (billDays + daysYours) long, so it can never disagree with the
  // ring's readout or the freedom day named in the lede.
  const calGrid = el("div", "freedom-cal-grid");
  calGrid.setAttribute("aria-hidden", "true");
  const kBill = el("span", "cal-key-val");
  const kDay = el("span", "cal-key-val");
  const kFree = el("span", "cal-key-val");
  const calKey = el(
    "div",
    "freedom-cal-key",
    el("span", "cal-key", el("i", "cal-key-sw is-bill"), kBill),
    el("span", "cal-key", el("i", "cal-key-sw is-freedom"), kDay),
    el("span", "cal-key", el("i", "cal-key-sw is-free"), kFree),
  );
  const calendar = el("div", "freedom-cal", calGrid, calKey);

  // Only rebuild when the shape actually changes — during a wage tween daysYours
  // steps integer by integer, so the days fill in green a few times, not 37.
  let calSig = "";
  function renderCalendar(daysYours: number, freedomDay: number): void {
    const billDays = Math.max(0, freedomDay - 1);
    const yours = Math.max(0, daysYours);
    const sig = `${billDays}:${yours}`;
    if (sig === calSig) return;
    calSig = sig;

    calKey.style.display = "";
    const total = billDays + yours;
    const cells: HTMLElement[] = [];
    for (let d = 1; d <= total; d++) {
      const free = d >= freedomDay;
      const mark = d === freedomDay && yours > 0;
      cells.push(
        el(
          "div",
          `cal-day${free ? " is-free" : " is-bill"}${mark ? " is-freedom" : ""}`,
          el("span", "cal-day-num tabular", String(d)),
        ),
      );
    }
    calGrid.replaceChildren(...cells);

    kBill.textContent = `Bills · ${billDays} ${billDays === 1 ? "day" : "days"}`;
    kDay.textContent = yours > 0 ? `Freedom day · the ${ordinal(freedomDay)}` : "No freedom day";
    kFree.textContent = `Yours · ${yours} ${yours === 1 ? "day" : "days"}`;
  }

  // The blank slate before any pay is entered: a quiet, neutral month.
  function renderCalendarEmpty(): void {
    calSig = "";
    calKey.style.display = "none";
    const cells: HTMLElement[] = [];
    for (let d = 1; d <= 30; d++) {
      cells.push(el("div", "cal-day is-empty", el("span", "cal-day-num tabular", String(d))));
    }
    calGrid.replaceChildren(...cells);
  }

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
      lede.textContent = "Add your pay and hours to see where the month goes.";
      for (const r of rows) {
        r.val.textContent = "—";
        r.unit.textContent = "";
      }
      renderCalendarEmpty();
      return;
    }

    const month = monthMinutes(hpw);
    const free = freeMinutes();
    const { daysYours, freedomDay } = freedom(free, month);
    renderCalendar(daysYours, freedomDay);

    // Bills read in concrete hours of work — the price you pay in time.
    const setTime = (r: Row, minutes: number) => {
      const p = primaryTime(minutes);
      r.val.textContent = p.value;
      r.unit.textContent = ` ${p.unit}`;
    };
    for (let i = 0; i < N; i++) setTime(rows[i], shown[i]);
    // The free row is the payoff, so it reads in days of the month that are yours.
    rows[FREE_I].val.textContent = String(daysYours);
    rows[FREE_I].unit.textContent = daysYours === 1 ? " day" : " days";

    // The lede tracks the free total (not the hovered wedge), so it stays put as you
    // explore the ring and only moves when your pay does.
    lede.textContent =
      daysYours <= 0
        ? "The bills eat the whole month — there's nothing left over."
        : freedomDay <= 1
          ? "The bills barely dent your month — almost all of it is yours."
          : `You work until the ${ordinal(freedomDay)} just to cover the bills — then you're working for yourself.`;

    const idx = hover ?? FREE_I;
    if (idx === FREE_I) {
      // The payoff: how much of the month is yours, and the day you cross into it.
      centerVal.textContent = String(daysYours);
      centerUnit.textContent = daysYours === 1 ? " day" : " days";
      centerCap.textContent = "are yours";
      share.classList.remove("is-hidden");
      if (daysYours > 0 && freedomDay > 1) {
        shareVal.textContent = ordinal(freedomDay);
        shareUnit.textContent = "onward";
      } else {
        share.classList.add("is-hidden");
      }
    } else {
      // A bill: what it costs you in hours, and its share of the working month.
      const p = primaryTime(shown[idx]);
      centerVal.textContent = p.value;
      centerUnit.textContent = ` ${p.unit}`;
      centerCap.textContent = MONTHLY_COSTS[idx].name;
      const sharePct = month > 0 ? Math.round((shown[idx] / month) * 100) : 0;
      share.classList.remove("is-hidden");
      shareVal.textContent = `${sharePct}%`;
      shareUnit.textContent = "of your month";
    }
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
      lede,
    ),
    calendar,
    // The ring is the same month told a second way — hour by hour. The bridge line
    // hands off from the calendar and carries the detail the note used to.
    el(
      "div",
      "monthly-breakdown",
      el(
        "p",
        "items-note monthly-bridge",
        "The same month, now hour by hour. The standing bill of a single person in San " +
          "Francisco — typical, rounded — claims each wedge in hours of work. What stays open " +
          "is yours, free & clear, and a raise makes it grow.",
      ),
      el("div", "donut-grid", figure, legend),
    ),
  );
}
