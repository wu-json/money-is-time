// A ladder of earners to measure your hour against — from the federal floor up
// to a billionaire's paper gains. Figures are rounded, illustrative, public
// estimates (total pay, not just base salary, where that's the famous number);
// the point is the order of magnitude, not the cents.
//
// To turn a yearly figure into an hourly one we divide by the hours each person
// actually works — or says they do — not a flat 40-hour week. A full-time grind
// is 40 h; a CEO's is ~62 (Harvard's time-use study); Musk claims 80–100. So the
// "hourly" reflects real effort, and every assumption is shown in the UI with its
// basis. Hours without a hard source are honest estimates, labeled as such.

// Weeks in a year — the bridge from a weekly-hours assumption to annual hours.
export const WEEKS_PER_YEAR = 52;

// A credible public landing page, shown as a clickable link so a claim is
// checkable, not asserted. Used both for the dollar figure and the hours basis.
export type Source = { label: string; url: string };

export type Person = {
  id: string;
  name: string;
  role: string; // the small descriptor under the figure
  annualUsd: number;
  weeklyHours: number; // hours worked per week — actual, claimed, or estimated
  hoursBasis: string; // short, plain-language basis for the hours, shown in the UI
  hoursSource?: Source; // citation for the hours claim, when a hard one exists
  note?: string; // optional caveat (e.g. wealth vs. wages)
  source: Source; // citation for the dollar figure
};

// Ordered low → high so the selector reads as a climb.
export const PEOPLE: Person[] = [
  {
    id: "minwage",
    name: "Minimum-wage worker",
    role: "U.S. federal floor, $7.25/hr full-time",
    annualUsd: 15_080,
    weeklyHours: 40,
    hoursBasis: "Full-time — 40 h/week",
    source: {
      label: "U.S. Dept. of Labor",
      url: "https://www.dol.gov/general/topic/wages/minimumwage",
    },
  },
  {
    id: "median",
    name: "The median American",
    role: "Typical full-time worker",
    // BLS 2025 median usual weekly earnings ($1,204) × 52 weeks.
    annualUsd: 62_600,
    weeklyHours: 40,
    hoursBasis: "Full-time — 40 h/week",
    source: {
      label: "BLS, 2025 usual weekly earnings",
      url: "https://www.bls.gov/news.release/wkyeng.htm",
    },
  },
  {
    id: "senator",
    name: "A U.S. Senator",
    role: "Salary plus estimated stock-trading gains",
    // $174K Senate salary (unchanged since 2009) plus a rough trading premium:
    // actively-trading members averaged ~26–31% in 2024, beating the S&P, so on
    // a portfolio in the low millions the gains can rival the salary. Squarely
    // an estimate — see the note below the comparison.
    annualUsd: 450_000,
    weeklyHours: 65,
    hoursBasis: "Congressional Mgmt. Foundation — ~70 h in session, ~59 in district",
    hoursSource: {
      label: "Roll Call — Congress's 70-hour week",
      url: "https://rollcall.com/2014/10/28/all-work-congress-averaging-70-hour-work-week/",
    },
    note: "≈ $174K Senate salary plus an estimated trading gain — active members averaged ~26–31% in 2024, beating the market.",
    source: {
      label: "Unusual Whales — 2024 Congressional Trading Report",
      url: "https://unusualwhales.com/congress-trading-report-2024",
    },
  },
  {
    id: "ceo",
    name: "An S&P 500 CEO",
    role: "Average pay for an S&P 500 chief executive",
    // AFL-CIO Executive Paywatch 2025 (2024 data): average S&P 500 CEO total comp.
    annualUsd: 18_900_000,
    weeklyHours: 62,
    hoursBasis: "Harvard CEO time-use study — ~62.5 h/week",
    hoursSource: {
      label: "HBR — How CEOs Manage Time",
      url: "https://hbr.org/2018/07/how-ceos-manage-time",
    },
    source: {
      label: "AFL-CIO Executive Paywatch 2025",
      url: "https://aflcio.org/paywatch",
    },
  },
  {
    id: "lebron",
    name: "LeBron James",
    role: "NBA salary + endorsements",
    annualUsd: 128_000_000,
    weeklyHours: 50,
    hoursBasis: "Trains 6 days/week year-round — games, travel & film on top (estimate)",
    hoursSource: {
      label: "SI — his training regimen",
      url: "https://www.si.com/nba/lebron-james-details-intense-weekly-offseason-training-regimen",
    },
    source: {
      label: "Forbes profile",
      url: "https://www.forbes.com/profile/lebron-james/",
    },
  },
  {
    id: "founder",
    name: "A founder who exited",
    role: "Payout from selling a startup",
    // Modeled on Kevin Systrom's reported ~$400M from Instagram's $1B sale to
    // Facebook (2012), spread across the ~2 years he built it from launch to
    // exit. A one-time wealth event, like Musk's — measured against the grind
    // that earned it: $400M ÷ ~2 years ≈ $200M/yr.
    annualUsd: 200_000_000,
    weeklyHours: 90,
    hoursBasis: "The startup grind — founders routinely log 80–100 h/week (estimate)",
    hoursSource: {
      label: "Survey — founders' 50–80+ hour weeks",
      url: "https://www.uktech.news/news/over-25-of-founders-work-50-to-80-hours-a-week-survey-finds-20170601",
    },
    note: "A one-time exit, not a salary — here, Instagram's ~$400M sale over ~2 years.",
    source: {
      label: "NBC News — Instagram's CEO and the $400M Facebook deal",
      url: "https://www.nbcnews.com/news/world/instagram-ceo-could-get-400-million-facebook-deal-flna689807",
    },
  },
  {
    id: "swift",
    name: "Taylor Swift",
    role: "A recent touring year",
    // Forbes estimate of Swift's 2024 pretax earnings (the Eras Tour year).
    annualUsd: 400_000_000,
    weeklyHours: 60,
    hoursBasis: "A tour year — months of 6-day prep, then 3.5-hour shows (estimate)",
    hoursSource: {
      label: "Time — her Eras prep",
      url: "https://time.com/6343028/taylor-swift-workout-routine-eras-tour/",
    },
    source: {
      label: "Forbes profile",
      url: "https://www.forbes.com/profile/taylor-swift/",
    },
  },
  {
    id: "trump",
    name: "Donald Trump",
    role: "His 2024 income — crypto, golf & licensing",
    // Trump's June 2025 federal financial disclosure (covering 2024): $600M+ in
    // income, led by ~$320M in $TRUMP meme-coin fees plus golf, hotels and
    // licensing. Revenue, not profit — and the $400K office salary is a rounding
    // error against it.
    annualUsd: 600_000_000,
    weeklyHours: 90,
    hoursBasis: "Accounts vary widely — long days, 7 days, plenty unstructured (estimate)",
    hoursSource: {
      label: "Zippia — the president's hours",
      url: "https://www.zippia.com/answers/how-many-hours-does-the-president-work/",
    },
    note: "Reported income, not profit — and the $400K presidential salary is a rounding error against it.",
    source: {
      label: "CNN — Trump's $600M+ in crypto, golf & licensing income",
      url: "https://www.cnn.com/2025/06/14/business/trump-income-crypto-licensing",
    },
  },
  {
    id: "musk",
    name: "Elon Musk",
    role: "SpaceX stake at its 2026 IPO",
    // June 2026 IPO: ~4.8B shares (~42%) at the $135 IPO price ≈ $648B,
    // the wealth event that made him the world's first trillionaire.
    annualUsd: 648_000_000_000,
    weeklyHours: 90,
    hoursBasis: "By his own account — 80–100 h/week",
    hoursSource: {
      label: "CNBC — Musk on his workweek",
      url: "https://www.cnbc.com/2018/11/05/elon-musk-on-working-120-hours-a-week-youll-go-bonkers.html",
    },
    note: "Wealth, not wages — but it's the same clock.",
    source: {
      label: "CBS — Musk becomes first trillionaire on SpaceX's IPO",
      url: "https://www.cbsnews.com/news/elon-musk-spacex-ipo-trillionaire-wealth/",
    },
  },
];
