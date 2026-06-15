// Boot. The reactive spine lives in ./store.ts; here we mount the salary/
// schedule inputs into #controls and the goods-as-time catalog into #items.

import { el } from "./dom";
import { resetSettings } from "./state";
import { salaryInput } from "./components/salaryInput";
import { scheduleSelector } from "./components/scheduleSelector";
import { itemsSection } from "./components/itemsSection";
import { monthlySection } from "./components/monthlySection";
import { comparisonSection } from "./components/comparisonSection";
import { dock } from "./components/dock";
import { topbar } from "./components/topbar";

function mountControls(): void {
  const controls = document.querySelector<HTMLElement>("#controls");
  if (!controls) return;

  const form = el("form", "controls-form");
  form.addEventListener("submit", (e) => e.preventDefault());

  form.append(salaryInput(), el("hr", "control-divider"), scheduleSelector());

  // Reset is destructive of everything the user typed (salary, schedule, and the
  // whole expense list), so it arms on the first click and only fires on the
  // second — a two-tap confirm that needs no modal. It disarms itself after a few
  // seconds or on blur, so a stray click can't wipe your numbers.
  const reset = el("button", "controls-reset") as HTMLButtonElement;
  reset.type = "button";
  const RESET_LABEL = "Reset to defaults";
  reset.textContent = RESET_LABEL;
  let armed = false;
  let armTimer = 0;
  const disarm = () => {
    armed = false;
    reset.classList.remove("is-armed");
    reset.textContent = RESET_LABEL;
  };
  reset.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      reset.classList.add("is-armed");
      reset.textContent = "Click again to reset everything";
      clearTimeout(armTimer);
      armTimer = window.setTimeout(disarm, 3500);
      return;
    }
    clearTimeout(armTimer);
    disarm();
    resetSettings();
  });
  reset.addEventListener("blur", () => {
    clearTimeout(armTimer);
    disarm();
  });

  // A quiet reassurance for anyone wary of typing their salary in: everything is
  // kept locally in this browser and never sent anywhere. The claim links to the
  // source so it can be verified, not just trusted.
  const source = el("a", "controls-privacy-link", "the source code") as HTMLAnchorElement;
  source.href = "https://github.com/wu-json/money-is-time";
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  const privacy = el(
    "p",
    "controls-privacy",
    "What you enter is saved in this browser only — never uploaded or sent anywhere. Verify it in ",
    source,
    ".",
  );

  controls.append(form, el("div", "controls-footer", reset, privacy));
}

function mountItems(): void {
  const items = document.querySelector<HTMLElement>("#items");
  if (!items) return;
  items.append(itemsSection());
  revealOnScroll(items);
}

function mountMonthly(): void {
  const monthly = document.querySelector<HTMLElement>("#monthly");
  if (!monthly) return;
  monthly.append(monthlySection());
}

function mountComparison(): void {
  const comparison = document.querySelector<HTMLElement>("#comparison");
  if (!comparison) return;
  comparison.append(comparisonSection());
}

// Fade each card up as it scrolls into view. Done before first paint (the class
// is added synchronously after mount), so there's no flash of visible content.
function revealOnScroll(root: HTMLElement): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".item"));
  if (!("IntersectionObserver" in window)) {
    cards.forEach((c) => c.classList.add("reveal", "is-visible"));
    return;
  }
  cards.forEach((c) => c.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );
  cards.forEach((c) => io.observe(c));
}

mountControls();
mountItems();
mountMonthly();
mountComparison();
document.body.append(topbar(), dock());
