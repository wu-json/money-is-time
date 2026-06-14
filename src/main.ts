// Boot. The reactive spine lives in ./store.ts; here we mount the salary/
// schedule inputs into #controls and the goods-as-time catalog into #items.

import { el } from "./dom";
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

  // A quiet reassurance for anyone wary of typing their salary in: nothing here
  // is stored or sent — it's a static page that runs entirely in the browser.
  // The claim links to the source so it can be verified, not just trusted.
  const source = el("a", "controls-privacy-link", "the source code") as HTMLAnchorElement;
  source.href = "https://github.com/wu-json/money-is-time";
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  const privacy = el(
    "p",
    "controls-privacy",
    "Nothing you enter is saved or sent — it stays in your browser. Verify it in ",
    source,
    ".",
  );

  controls.append(form, privacy);
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
