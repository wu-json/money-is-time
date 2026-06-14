// A floating dock, pinned bottom-right, that follows you down the page: it shows
// your income and schedule at a glance and unfolds into a compact editor so you
// can tweak the numbers from anywhere — no scrolling back to the top controls.
//
// It writes to the very same `salary` / `schedule` signals as the main panel, so
// the two stay in lockstep automatically. To avoid doubling up, the dock keeps
// out of sight while the top controls are on screen and fades in once you've
// scrolled past them.

import { el } from "../dom";
import { effect } from "../store";
import { salary, schedule } from "../state";
import { HI, STEPS, posToSalary, salaryToPos } from "../salaryScale";

const groups = new Intl.NumberFormat("en-US");

const HOURS_IN_WEEK = 168;

type DockPreset = { id: "9to5" | "996" | "9127"; label: string; hours: number };
const PRESETS: DockPreset[] = [
  { id: "9to5", label: "9 to 5", hours: 40 },
  { id: "996", label: "996", hours: 72 },
  { id: "9127", label: "9 to 1", hours: 112 },
];

// The label shown beside the hours in the summary line.
function scheduleLabel(presetId: string): string {
  return PRESETS.find((p) => p.id === presetId)?.label ?? "Custom";
}

function clampHours(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.round(value), HOURS_IN_WEEK);
}

const CHEVRON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

function glyph(cls: string, svg: string): HTMLElement {
  const span = el("span", cls);
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = svg;
  return span;
}

export function dock(): HTMLElement {
  const root = el("div", "dock");

  // --- Summary header (also the open/close toggle) -------------------------
  const sumIncome = el("span", "dock-income tabular");
  const sumSched = el("span", "dock-sched tabular");
  const toggle = el(
    "button",
    "dock-toggle",
    el("span", "dock-summary", sumIncome, sumSched),
    glyph("dock-chevron", CHEVRON),
  ) as HTMLButtonElement;
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");

  // --- Income editor -------------------------------------------------------
  const incInput = el("input", "field-input tabular") as HTMLInputElement;
  incInput.type = "text";
  incInput.inputMode = "numeric";
  incInput.autocomplete = "off";
  incInput.setAttribute("aria-label", "What you make in a year, in US dollars");
  const incControl = el(
    "span",
    "field-control dock-income-control",
    el("span", "field-suffix", "$"),
    incInput,
  );

  const slider = el("input", "slider dock-slider") as HTMLInputElement;
  slider.type = "range";
  slider.min = "0";
  slider.max = String(STEPS);
  slider.step = "1";
  slider.setAttribute("aria-label", "What you make in a year, in US dollars");

  // --- Schedule editor -----------------------------------------------------
  const chipEls = PRESETS.map((p) => {
    const btn = el(
      "button",
      "dock-chip",
      el("span", "dock-chip-h tabular", `${p.hours}h`),
      el("span", "dock-chip-l", p.label),
    ) as HTMLButtonElement;
    btn.type = "button";
    btn.addEventListener("click", () =>
      schedule.set({ hoursPerWeek: p.hours, presetId: p.id }),
    );
    return { preset: p, btn };
  });
  const chips = el("div", "dock-chips", ...chipEls.map((c) => c.btn));

  const hoursInput = el("input", "field-input tabular") as HTMLInputElement;
  hoursInput.type = "number";
  hoursInput.min = "1";
  hoursInput.max = String(HOURS_IN_WEEK);
  hoursInput.step = "1";
  hoursInput.inputMode = "numeric";
  hoursInput.setAttribute("aria-label", "Hours worked per week");
  const hoursControl = el(
    "span",
    "field-control dock-hours-control",
    hoursInput,
    el("span", "field-suffix", "hrs / week"),
  );

  const editor = el(
    "div",
    "dock-editor",
    el(
      "div",
      "dock-editor-pad",
      el("span", "dock-flabel", "Income / year"),
      incControl,
      slider,
      el("span", "dock-flabel", "Work schedule"),
      chips,
      hoursControl,
    ),
  );
  const editorId = "dock-editor";
  editor.id = editorId;
  toggle.setAttribute("aria-controls", editorId);
  const editorWrap = el("div", "dock-editor-wrap", editor);

  root.append(toggle, editorWrap);

  // --- Open / close --------------------------------------------------------
  let open = false;
  const setOpen = (next: boolean) => {
    open = next;
    root.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => setOpen(!open));

  // --- Income wiring (mirrors salaryInput) ---------------------------------
  incInput.addEventListener("focus", () => {
    incInput.value = salary() ? String(salary()) : "";
    incInput.select();
  });
  incInput.addEventListener("input", () => {
    const digits = incInput.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    if (digits !== incInput.value) incInput.value = digits;
    salary.set(digits ? Math.min(HI, Number(digits)) : 0);
  });
  incInput.addEventListener("blur", () => {
    incInput.value = salary() ? groups.format(salary()) : "";
  });
  slider.addEventListener("input", () =>
    salary.set(posToSalary(Number(slider.value))),
  );

  // --- Schedule wiring -----------------------------------------------------
  hoursInput.addEventListener("input", () =>
    schedule.set({
      hoursPerWeek: clampHours(hoursInput.valueAsNumber),
      presetId: "custom",
    }),
  );
  hoursInput.addEventListener("blur", () => {
    hoursInput.value = schedule().hoursPerWeek
      ? String(schedule().hoursPerWeek)
      : "";
  });

  // --- Signal -> display ---------------------------------------------------
  effect(() => {
    const s = salary();
    sumIncome.textContent = s ? `$${groups.format(s)}` : "$0";
    const pos = salaryToPos(s);
    slider.style.setProperty("--fill", `${(pos / STEPS) * 100}%`);
    if (document.activeElement !== slider) slider.value = String(pos);
    if (document.activeElement !== incInput) {
      incInput.value = s ? groups.format(s) : "";
    }
  });

  effect(() => {
    const sc = schedule();
    sumSched.textContent = `${sc.hoursPerWeek}h · ${scheduleLabel(sc.presetId)}`;
    for (const { preset, btn } of chipEls) {
      const active = sc.presetId === preset.id;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    }
    if (document.activeElement !== hoursInput) {
      hoursInput.value = sc.hoursPerWeek ? String(sc.hoursPerWeek) : "";
    }
  });

  // --- Stay out of the way while the top controls are on screen ------------
  const controls = document.querySelector<HTMLElement>("#controls");
  if (controls && "IntersectionObserver" in window) {
    root.classList.add("is-hidden"); // assume controls visible at first paint
    const io = new IntersectionObserver(
      ([entry]) => {
        const showDock = !entry.isIntersecting;
        root.classList.toggle("is-hidden", !showDock);
        if (!showDock) setOpen(false); // tidy up when it slips away
      },
      { rootMargin: "-12% 0px -12% 0px" },
    );
    io.observe(controls);
  }

  return root;
}
