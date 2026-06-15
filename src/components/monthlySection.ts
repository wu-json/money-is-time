// A month of living, told in time. The whole ring is your working month — every
// hour you clock in. Your recurring bills (rent, groceries, utilities…) each claim
// a wedge in hours of work; what's left open is yours: free & clear.
//
// The bills aren't fixed: every amount is editable inline, lines can be added or
// dropped, so the ring is *your* month, not an assumed one. And unlike the goods
// cards, this chart reshapes with your pay — a category's hours are its dollars ÷
// your after-tax wage, so a raise shrinks every wedge and the open arc grows. The
// freedom-day calendar below is derived from the same numbers, so editing a bill
// up here moves the day you start working for yourself down there.

import { el } from "../dom";
import { effect } from "../store";
import { tweenNumber } from "../tween";
import {
  netHourlyWageUsd,
  schedule,
  monthlyCosts,
  newCostId,
} from "../state";
import { primaryTime } from "../format";
import { rampColor, type MonthlyCost } from "../data/monthly";

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const groups = new Intl.NumberFormat("en-US");

// No single bill should be able to break the geometry; a million a month is well
// past any real one and keeps the inputs from overflowing.
const MAX_USD = 1_000_000;

// Donut geometry. R leaves room for the active wedge to thicken without clipping
// the 200×200 viewBox. GAP is the hairline of track left between wedges.
const R = 80;
const SW = 24;
const C = 2 * Math.PI * R;
const GAP = 0.01; // as a fraction of the full ring

// A small X for the remove control — line glyph, inherits the row's muted ink.
const X_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const PLUS_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

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
    v >= 11 && v <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

// The whole point, in one struct: map the bills' share of your *working* month onto
// the calendar. `freedomDay` is the day you stop covering bills and start earning for
// yourself; `daysYours` is how much of the month that leaves you. The fraction comes
// from labor-time (dollars ÷ wage), spread evenly across the days.
function freedom(freeMin: number, monthMin: number) {
  const freeFrac =
    monthMin > 0 ? Math.max(0, Math.min(1, freeMin / monthMin)) : 0;
  const daysYours = Math.round(freeFrac * DAYS_PER_MONTH);
  const billDays = DAYS_PER_MONTH - freeFrac * DAYS_PER_MONTH;
  const freedomDay = Math.min(31, Math.floor(billDays) + 1);
  return { daysYours, freedomDay };
}

// One legend row. Expense rows carry editable name/amount inputs and a remove
// button; the free row is a read-only payoff line, so its inputs are absent.
type Row = {
  node: HTMLElement;
  timeVal: HTMLElement;
  timeUnit: HTMLElement;
  nameInput?: HTMLInputElement;
};

export function monthlySection(): HTMLElement {
  // The dynamic punch line under the heading — rewritten on every change to name
  // the day you stop working for the bills and start working for yourself.
  const lede = el("p", "items-lede");

  // --- The figure: ring + the readout floating in its hole -----------------
  // A faint track shows the full month; colored wedges are drawn onto it each
  // frame, and the free wedge is a calm green that brightens when you ask for it.
  // Segment circles are rebuilt whenever the expense list grows or shrinks.
  const figure = el("div", "donut-figure");
  figure.innerHTML =
    `<svg class="donut-svg" viewBox="0 0 200 200" role="img" ` +
    `aria-label="Your working month, split between bills and free time"></svg>`;
  const svg = figure.querySelector<SVGSVGElement>("svg")!;

  const centerVal = el("span", "item-time-value tabular");
  const centerUnit = el("span", "item-time-unit");
  const center = el("div", "item-time is-donut", centerVal, centerUnit);
  const centerCap = el("p", "item-ofwork", "free & clear");
  const share = el("p", "item-practice");
  const shareVal = el("span", "item-practice-value tabular");
  const shareUnit = el("span", "item-practice-unit");
  share.append(shareVal, shareUnit);
  figure.append(el("div", "donut-center", center, centerCap, share));

  // --- The legend: one editable row per bill, an add button, then "free & clear".
  const legend = el("div", "donut-legend");
  const addBtn = el("button", "donut-add") as HTMLButtonElement;
  addBtn.type = "button";
  const addIcon = el("span", "donut-add-icon");
  addIcon.setAttribute("aria-hidden", "true");
  addIcon.innerHTML = PLUS_ICON;
  addBtn.append(addIcon, el("span", undefined, "Add an expense"));
  addBtn.addEventListener("click", () => {
    const id = newCostId();
    monthlyCosts.set((list) => [...list, { id, name: "", monthlyUsd: 0 }]);
    rowById.get(id)?.nameInput?.focus();
  });

  // --- The calendar: the same story laid on a month --------------------------
  // The bills claim a grey run at the start; the freedom day is the deep-green
  // turn; everything after is yours. The grid is exactly (billDays + daysYours)
  // long, so it can never disagree with the ring or the day named in the lede.
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
  const calNote = el(
    "p",
    "items-note freedom-cal-note",
    "The same month as days on a calendar: work through the bill days up front, " +
      "then the deep-green turn is the day the rest becomes yours.",
  );
  const calendar = el("div", "freedom-cal", calNote, calGrid, calKey);

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
    kDay.textContent =
      yours > 0 ? `Freedom day · the ${ordinal(freedomDay)}` : "No freedom day";
    kFree.textContent = `Yours · ${yours} ${yours === 1 ? "day" : "days"}`;
  }

  // The blank slate before any pay is entered: a quiet, neutral month.
  function renderCalendarEmpty(): void {
    calSig = "";
    calKey.style.display = "none";
    const cells: HTMLElement[] = [];
    for (let d = 1; d <= 30; d++) {
      cells.push(
        el(
          "div",
          "cal-day is-empty",
          el("span", "cal-day-num tabular", String(d)),
        ),
      );
    }
    calGrid.replaceChildren(...cells);
  }

  // --- Live structure -------------------------------------------------------
  // These mirror the current expense list and rebuild only when its shape (ids)
  // changes — editing an amount leaves the DOM in place so the input keeps focus.
  let costs: MonthlyCost[] = [];
  let N = 0;
  let allSegs: SVGCircleElement[] = [];
  let essSegs: SVGCircleElement[] = [];
  let freeSeg: SVGCircleElement;
  let rows: Row[] = [];
  let rowById = new Map<string, Row>();
  let shown: number[] = []; // labor-minutes currently displayed per category
  let structSig = "";
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
      seg.setAttribute(
        "stroke-dasharray",
        `${arc.toFixed(2)} ${(C - arc).toFixed(2)}`,
      );
      seg.setAttribute("stroke-dashoffset", `${(-cum * C).toFixed(2)}`);
      cum += f;
      remaining -= f;
    };
    for (let i = 0; i < N; i++) draw(essSegs[i], shown[i] / month);
    draw(freeSeg, remaining); // whatever's left of the turn is free
  }

  function paint(): void {
    const FREE_I = N;
    if (empty) {
      centerVal.textContent = "—";
      centerUnit.textContent = "";
      centerCap.textContent = "free & clear";
      share.classList.add("is-hidden");
      lede.textContent = "Add your pay and hours to see where the month goes.";
      for (const r of rows) {
        r.timeVal.textContent = "—";
        r.timeUnit.textContent = "";
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
      r.timeVal.textContent = p.value;
      r.timeUnit.textContent = ` ${p.unit}`;
    };
    for (let i = 0; i < N; i++) setTime(rows[i], shown[i]);
    // The free row is the payoff, so it reads in days of the month that are yours.
    rows[FREE_I].timeVal.textContent = String(daysYours);
    rows[FREE_I].timeUnit.textContent = daysYours === 1 ? " day" : " days";

    // The lede tracks the free total (not the hovered wedge), so it stays put as you
    // explore the ring and only moves when your pay or your bills do.
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
      centerCap.textContent = costs[idx].name || "Expense";
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

  // Read the live amount for a bill — used by the amount field's focus/blur so it
  // can swap between raw digits (editing) and grouped commas (at rest).
  const liveUsd = (id: string): number =>
    monthlyCosts().find((c) => c.id === id)?.monthlyUsd ?? 0;

  // Build one editable expense row. `id` is captured for the handlers; `idx`/`n`
  // are only the paint-time position and color, refreshed on every rebuild.
  function makeExpenseRow(cost: MonthlyCost, idx: number, n: number): Row {
    const swatch = el("span", "donut-swatch");
    swatch.style.background = rampColor(idx, n);

    const nameInput = el("input", "donut-row-name-input") as HTMLInputElement;
    nameInput.type = "text";
    nameInput.value = cost.name;
    nameInput.placeholder = "Expense";
    nameInput.setAttribute("aria-label", "Expense name");
    nameInput.addEventListener("input", () => {
      const name = nameInput.value;
      monthlyCosts.set((list) =>
        list.map((c) => (c.id === cost.id ? { ...c, name } : c)),
      );
    });

    const amountInput = el(
      "input",
      "donut-row-amount-input tabular",
    ) as HTMLInputElement;
    amountInput.type = "text";
    amountInput.inputMode = "numeric";
    amountInput.autocomplete = "off";
    amountInput.placeholder = "0";
    amountInput.value = cost.monthlyUsd ? groups.format(cost.monthlyUsd) : "";
    amountInput.setAttribute("aria-label", `${cost.name || "Expense"} per month, in US dollars`);
    amountInput.addEventListener("focus", () => {
      const v = liveUsd(cost.id);
      amountInput.value = v ? String(v) : "";
      amountInput.select();
    });
    amountInput.addEventListener("input", () => {
      const digits = amountInput.value
        .replace(/\D/g, "")
        .replace(/^0+(?=\d)/, "");
      if (digits !== amountInput.value) amountInput.value = digits;
      const usd = digits ? Math.min(MAX_USD, Number(digits)) : 0;
      monthlyCosts.set((list) =>
        list.map((c) => (c.id === cost.id ? { ...c, monthlyUsd: usd } : c)),
      );
    });
    amountInput.addEventListener("blur", () => {
      const v = liveUsd(cost.id);
      amountInput.value = v ? groups.format(v) : "";
    });

    const amountWrap = el(
      "span",
      "donut-row-amount",
      el("span", "donut-amount-prefix", "$"),
      amountInput,
    );
    const edit = el("div", "donut-row-edit", nameInput, amountWrap);

    const timeVal = el("span", "donut-row-value tabular");
    const timeUnit = el("span", "donut-row-unit");
    const time = el("span", "donut-row-time", timeVal, timeUnit);

    const remove = el("button", "donut-row-remove") as HTMLButtonElement;
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${cost.name || "this expense"}`);
    remove.innerHTML = X_ICON;
    remove.addEventListener("click", () =>
      monthlyCosts.set((list) => list.filter((c) => c.id !== cost.id)),
    );

    const node = el("div", "donut-row is-editable", swatch, edit, time, remove);
    return { node, timeVal, timeUnit, nameInput };
  }

  // The read-only payoff row at the foot of the legend.
  function makeFreeRow(): Row {
    const swatch = el("span", "donut-swatch is-free");
    const timeVal = el("span", "donut-row-value tabular");
    const timeUnit = el("span", "donut-row-unit");
    const node = el(
      "div",
      "donut-row is-freerow",
      swatch,
      el(
        "span",
        "donut-row-text",
        el("span", "donut-row-name", "Yours, free & clear"),
        el("span", "donut-row-detail", "the days you work for yourself"),
      ),
      el("span", "donut-row-time", timeVal, timeUnit),
    );
    return { node, timeVal, timeUnit };
  }

  // Tear down and rebuild the ring segments + legend rows for the current list.
  // Displayed minutes carry over by id so only the changed wedge has to animate.
  function rebuildStructure(list: MonthlyCost[]): void {
    const n = list.length;
    const prev = new Map<string, number>();
    costs.forEach((c, i) => prev.set(c.id, shown[i] ?? 0));

    const segMarkup = list
      .map(
        (_, i) =>
          `<circle class="donut-seg" data-i="${i}" cx="100" cy="100" r="${R}" ` +
          `fill="none" stroke="${rampColor(i, n)}" stroke-width="${SW}" ` +
          `stroke-dasharray="0 ${C.toFixed(2)}" stroke-dashoffset="0" ` +
          `transform="rotate(-90 100 100)" />`,
      )
      .join("");
    const freeMarkup =
      `<circle class="donut-seg donut-free" data-i="${n}" cx="100" cy="100" r="${R}" ` +
      `fill="none" stroke-width="${SW}" stroke-dasharray="0 ${C.toFixed(2)}" ` +
      `stroke-dashoffset="0" transform="rotate(-90 100 100)" />`;
    svg.innerHTML =
      `<circle class="donut-track" cx="100" cy="100" r="${R}" fill="none" stroke-width="${SW}" />` +
      segMarkup +
      freeMarkup;
    allSegs = Array.from(svg.querySelectorAll<SVGCircleElement>(".donut-seg"));
    essSegs = allSegs.slice(0, n);
    freeSeg = allSegs[n];

    rowById = new Map();
    const exRows = list.map((c, i) => {
      const r = makeExpenseRow(c, i, n);
      rowById.set(c.id, r);
      return r;
    });
    const freeRow = makeFreeRow();
    rows = [...exRows, freeRow];
    legend.replaceChildren(...exRows.map((r) => r.node), addBtn, freeRow.node);

    // Rebind highlight wiring to the fresh nodes.
    allSegs.forEach((s, i) => hoverBind(i, s));
    rows.forEach((r, i) => {
      hoverBind(i, r.node);
      r.node.addEventListener("focusin", () => setActive(i));
      r.node.addEventListener("focusout", () => setActive(null));
    });

    costs = list;
    N = n;
    shown = list.map((c) => prev.get(c.id) ?? 0);
    hover = null;
    figure.classList.remove("is-hovering");
  }

  // --- Reactive numbers ----------------------------------------------------
  let cancel: () => void = () => {};
  effect(() => {
    const list = monthlyCosts();
    const wage = netHourlyWageUsd();
    hpw = schedule().hoursPerWeek;
    cancel();

    const sig = list.map((c) => c.id).join(",");
    if (sig !== structSig) {
      rebuildStructure(list);
      structSig = sig;
    } else {
      // Same shape, edited values: keep the DOM (and focus) and just refresh the
      // colors/targets from the new amounts.
      costs = list;
    }

    if (wage <= 0 || hpw <= 0) {
      empty = true;
      shown.fill(0);
      layout();
      paint();
      return;
    }
    empty = false;

    const targets = costs.map((c) => (c.monthlyUsd / wage) * 60);
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
    // The ring comes first: it's the editable view of the month, hour by hour. Set
    // your own bills here and the calendar below reshapes to match.
    el(
      "div",
      "monthly-breakdown",
      el(
        "p",
        "items-note monthly-bridge",
        "Your month, hour by hour. These are typical standing bills to start from — " +
          "edit any amount, add your own, or drop what doesn't fit. Each one claims its " +
          "wedge in hours of work; what stays open is yours, free & clear, and a raise " +
          "makes it grow.",
      ),
      el("div", "donut-grid", figure, legend),
    ),
    calendar,
  );
}
