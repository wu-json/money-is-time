// A small cluster of links pinned to the top-right of the page: view the
// source on GitHub and read the blog post. Built to sit quietly in the same
// ink-on-paper palette as the rest of the sheet — paper pills, hairline
// borders, no color until you hover.

import { el } from "../dom";

// GitHub mark — the standard Octicons silhouette in a 24×24 viewBox.
const ICON_GITHUB =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.16-.02-2.11-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>';

// Blossom — five petals at 72° increments around a centered disc, in a 100×100
// viewBox. Placeholder mark for the blog-post link.
const ICON_BLOSSOM =
  '<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><ellipse cx="50" cy="22" rx="10" ry="22"/><ellipse cx="50" cy="22" rx="10" ry="22" transform="rotate(72 50 50)"/><ellipse cx="50" cy="22" rx="10" ry="22" transform="rotate(144 50 50)"/><ellipse cx="50" cy="22" rx="10" ry="22" transform="rotate(216 50 50)"/><ellipse cx="50" cy="22" rx="10" ry="22" transform="rotate(288 50 50)"/><circle cx="50" cy="50" r="8"/></svg>';

function link(
  cls: string,
  href: string,
  ariaLabel: string,
  icon: string,
  label: string,
): HTMLAnchorElement {
  const a = el("a", `topbar-link ${cls}`) as HTMLAnchorElement;
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.setAttribute("aria-label", ariaLabel);
  const glyph = el("span", "topbar-icon");
  glyph.setAttribute("aria-hidden", "true");
  glyph.innerHTML = icon;
  a.append(glyph, el("span", "topbar-label", label));
  return a;
}

export function topbar(): HTMLElement {
  // TODO: swap this placeholder URL once the blog post lands.
  return el(
    "nav",
    "topbar",
    link(
      "topbar-gh",
      "https://github.com/wu-json/money-is-time",
      "View the source on GitHub",
      ICON_GITHUB,
      "SRC",
    ),
    link(
      "topbar-blog",
      "https://www.jasonwu.ink/signals/2026-06-14-money-is-time",
      "Read the blog post",
      ICON_BLOSSOM,
      "Blog",
    ),
  );
}
