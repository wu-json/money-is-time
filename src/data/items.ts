// The catalog of goods, in narrative order — a day in San Francisco that
// escalates from a $6 coffee to a $26k car. Each carries a playful prompt and a
// `variant` that picks how the card renders, so the section reads as an
// editorial sequence rather than a uniform grid.

export type ItemVariant =
  | "ribbon"
  | "card"
  | "feature"
  | "hero"
  | "tax"
  | "milestone";

export type Item = {
  id: string;
  prompt: string; // the conversational hook
  name: string;
  place: string; // where / what kind, shown smaller
  priceUsd?: number; // fixed price; omitted when computed (e.g. taxes)
  icon: string; // inline SVG
  note?: string; // optional aside (e.g. DoorDash fees)
  variant: ItemVariant;
};

const stroke =
  'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

const CUP = `<svg viewBox="0 0 24 24" ${stroke}><path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 9h2.2a2.3 2.3 0 0 1 0 4.6H16"/><path d="M8 3v2M11 3v2"/></svg>`;
const UTENSILS = `<svg viewBox="0 0 24 24" ${stroke}><path d="M6 3v6a2 2 0 0 0 4 0V3"/><path d="M8 9v12"/><path d="M16 3c-1.7 0-3 2.2-3 5s1.3 4 3 4v9"/></svg>`;
const BAG = `<svg viewBox="0 0 24 24" ${stroke}><path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`;
const HOUSE = `<svg viewBox="0 0 24 24" ${stroke}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`;
const CAR = `<svg viewBox="0 0 24 24" ${stroke}><path d="M5 13l1.6-4.6A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.4L19 13"/><path d="M3 13h18v4H3z"/><circle cx="7.5" cy="17.5" r="1.4"/><circle cx="16.5" cy="17.5" r="1.4"/></svg>`;
const RECEIPT = `<svg viewBox="0 0 24 24" ${stroke}><path d="M6 2.5h12v19l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>`;
const PHONE = `<svg viewBox="0 0 24 24" ${stroke}><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>`;
const RING = `<svg viewBox="0 0 24 24" ${stroke}><path d="M9 7.5 12 4l3 3.5-3 3z"/><circle cx="12" cy="15" r="5.5"/></svg>`;
const STROLLER = `<svg viewBox="0 0 24 24" ${stroke}><path d="M4 11a8 8 0 0 1 8-8v8z"/><path d="M4 11h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><circle cx="8.5" cy="20" r="1.4"/><circle cx="15.5" cy="20" r="1.4"/></svg>`;
const KEY = `<svg viewBox="0 0 24 24" ${stroke}><circle cx="8.5" cy="8.5" r="4.5"/><path d="M11.7 11.7 20 20"/><path d="M16.5 16.5l2-2"/><path d="M18.5 18.5l2-2"/></svg>`;
const LAPTOP = `<svg viewBox="0 0 24 24" ${stroke}><rect x="4" y="4.5" width="16" height="11" rx="1.5"/><path d="M2.5 19h19"/></svg>`;
const DUMBBELL = `<svg viewBox="0 0 24 24" ${stroke}><path d="M4 7v10M7 9v6M17 9v6M20 7v10M7 12h10"/></svg>`;
const PLANE = `<svg viewBox="0 0 24 24" ${stroke}><path d="M17.8 19.2 16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-.9 1.7l5.6 3.2-2.8 2.8H4.5a.8.8 0 0 0-.5 1.4l3 2 2 3a.8.8 0 0 0 1.4-.5v-2.2l2.8-2.8 3.2 5.6a1 1 0 0 0 1.7-.9z"/></svg>`;

export const ITEMS: Item[] = [
  {
    id: "coffee",
    prompt: "Down for a coffee chat?",
    name: "Iced NOLA",
    place: "Blue Bottle",
    priceUsd: 6.25,
    icon: CUP,
    variant: "ribbon",
  },
  {
    id: "brunch",
    prompt: "Let's get food.",
    name: "Salmon brunch",
    place: "somewhere in SF",
    priceUsd: 28,
    icon: UTENSILS,
    variant: "card",
  },
  {
    id: "doordash",
    prompt: "Actually, let's just DoorDash.",
    name: "Dinner, delivered",
    place: "DoorDash",
    priceUsd: 35,
    icon: BAG,
    note: "after delivery, fees & tip",
    variant: "card",
  },
  {
    id: "iphone",
    prompt: "Gotta have the new one.",
    name: "iPhone 16 Pro",
    place: "this year's model",
    priceUsd: 999,
    icon: PHONE,
    variant: "card",
  },
  {
    id: "macbook",
    prompt: "For work, obviously.",
    name: "MacBook Pro",
    place: "14-inch, mid specs",
    priceUsd: 2499,
    icon: LAPTOP,
    variant: "card",
  },
  {
    id: "ring",
    prompt: "Put a ring on it.",
    name: "Engagement ring",
    place: "US average",
    priceUsd: 5500,
    icon: RING,
    note: "Tradition says spend two months' pay.",
    variant: "card",
  },
  {
    id: "gym",
    prompt: "New year, new me.",
    name: "Gym membership",
    place: "every month",
    priceUsd: 60,
    icon: DUMBBELL,
    note: "Funded entirely by your resolution.",
    variant: "card",
  },
  {
    id: "japan",
    prompt: "Need a break.",
    name: "Round-trip flight to Japan",
    place: "SFO → Tokyo, economy",
    priceUsd: 1200,
    icon: PLANE,
    variant: "card",
  },
  {
    id: "rent",
    prompt: "Rent day.",
    name: "One month, 1-bed",
    place: "in San Francisco",
    priceUsd: 3300,
    icon: HOUSE,
    variant: "feature",
  },
  {
    id: "tax",
    prompt: "Tax season.",
    name: "Federal + California income tax",
    place: "every year",
    icon: RECEIPT,
    note: "Single filer, standard deduction, 2025 brackets — a rough estimate.",
    variant: "tax",
  },
  {
    id: "car",
    prompt: "Treat yourself.",
    name: "Mazda CX-30",
    place: "new, off the lot",
    priceUsd: 26000,
    icon: CAR,
    variant: "hero",
  },
  {
    id: "kid",
    prompt: "Tiny humans.",
    name: "Raising one kid to 18",
    place: "USDA estimate",
    priceUsd: 310000,
    icon: STROLLER,
    note: "And that's before a single tuition bill.",
    variant: "milestone",
  },
  {
    id: "home",
    prompt: "The dream.",
    name: "Median San Francisco home",
    place: "just the sticker price",
    priceUsd: 1300000,
    icon: KEY,
    note: "Before ~30 years of mortgage interest.",
    variant: "milestone",
  },
  {
    id: "home-south",
    prompt: "The Southern dream.",
    name: "The same house, down South",
    place: "a 3-bed in Tennessee",
    priceUsd: 340000,
    icon: HOUSE,
    note: "A quarter of the SF price — a whole life cheaper.",
    variant: "milestone",
  },
];
