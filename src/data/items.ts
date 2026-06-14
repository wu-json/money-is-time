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
const WHEEL = `<svg viewBox="0 0 24 24" ${stroke}><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.3"/><path d="M12 9.7V4M10.1 13.6 5.2 17M13.9 13.6 18.8 17"/></svg>`;
const TRAIN = `<svg viewBox="0 0 24 24" ${stroke}><rect x="6" y="3.5" width="12" height="13" rx="2.5"/><path d="M6 11h12"/><path d="M9.5 14.2h.01M14.5 14.2h.01"/><path d="M8.5 16.5 6.5 20M15.5 16.5 17.5 20"/></svg>`;
const PHONE = `<svg viewBox="0 0 24 24" ${stroke}><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>`;
const RING = `<svg viewBox="0 0 24 24" ${stroke}><path d="M9 7.5 12 4l3 3.5-3 3z"/><circle cx="12" cy="15" r="5.5"/></svg>`;
const STROLLER = `<svg viewBox="0 0 24 24" ${stroke}><path d="M4 11a8 8 0 0 1 8-8v8z"/><path d="M4 11h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><circle cx="8.5" cy="20" r="1.4"/><circle cx="15.5" cy="20" r="1.4"/></svg>`;
const KEY = `<svg viewBox="0 0 24 24" ${stroke}><circle cx="8.5" cy="8.5" r="4.5"/><path d="M11.7 11.7 20 20"/><path d="M16.5 16.5l2-2"/><path d="M18.5 18.5l2-2"/></svg>`;
const LAPTOP = `<svg viewBox="0 0 24 24" ${stroke}><rect x="4" y="4.5" width="16" height="11" rx="1.5"/><path d="M2.5 19h19"/></svg>`;
const DUMBBELL = `<svg viewBox="0 0 24 24" ${stroke}><path d="M4 7v10M7 9v6M17 9v6M20 7v10M7 12h10"/></svg>`;
const PLANE = `<svg viewBox="0 0 24 24" ${stroke}><path d="M17.8 19.2 16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-.9 1.7l5.6 3.2-2.8 2.8H4.5a.8.8 0 0 0-.5 1.4l3 2 2 3a.8.8 0 0 0 1.4-.5v-2.2l2.8-2.8 3.2 5.6a1 1 0 0 0 1.7-.9z"/></svg>`;
const BOBA = `<svg viewBox="0 0 24 24" ${stroke}><path d="M7 8h10l-1 12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z"/><path d="M5.5 8h13"/><path d="M13 8l3-4.5"/><circle cx="10" cy="17.5" r=".6"/><circle cx="13" cy="18.5" r=".6"/><circle cx="11.6" cy="15.2" r=".6"/></svg>`;
const BEER = `<svg viewBox="0 0 24 24" ${stroke}><path d="M6 7h9v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M15 9h2.5A1.5 1.5 0 0 1 19 10.5v3A1.5 1.5 0 0 1 17.5 15H15"/><path d="M6 10h9"/></svg>`;
const LIPSTICK = `<svg viewBox="0 0 24 24" ${stroke}><rect x="8.5" y="12" width="7" height="9" rx="1"/><path d="M9.5 12V8l3.5-4 2 1.5V12"/></svg>`;
const TICKET = `<svg viewBox="0 0 24 24" ${stroke}><path d="M3 8h18v3a1.8 1.8 0 0 0 0 4v3H3v-3a1.8 1.8 0 0 0 0-4z"/><path d="M14.5 8v1M14.5 12v1.5M14.5 16v1"/></svg>`;

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
    id: "boba",
    prompt: "Boba run?",
    name: "Brown sugar milk tea",
    place: "large, extra pearls",
    priceUsd: 6.75,
    icon: BOBA,
    variant: "card",
  },
  {
    id: "beer",
    prompt: "One after work.",
    name: "Pint of IPA",
    place: "a SF bar",
    priceUsd: 10,
    icon: BEER,
    variant: "card",
  },
  {
    id: "muni",
    prompt: "Off to work.",
    name: "Muni, round-trip",
    place: "the daily commute",
    priceUsd: 5.5,
    icon: TRAIN,
    note: "Two rides on a Clipper card — across town and back.",
    variant: "card",
  },
  {
    id: "waymo",
    prompt: "Or skip the train.",
    name: "The same commute, by Waymo",
    place: "round-trip, no driver",
    priceUsd: 36,
    icon: WHEEL,
    note: "Same trip, ~6× the fare — and no one to tip.",
    variant: "card",
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
    name: "Brunch, delivered",
    place: "DoorDash",
    priceUsd: 35,
    icon: BAG,
    note: "after delivery, fees & tip",
    variant: "card",
  },
  {
    id: "lipstick",
    prompt: "A little treat.",
    name: "Designer lipstick",
    place: "Charlotte Tilbury",
    priceUsd: 38,
    icon: LIPSTICK,
    variant: "card",
  },
  {
    id: "concert",
    prompt: "They're in town!",
    name: "Concert ticket",
    place: "one night, plus fees",
    priceUsd: 95,
    icon: TICKET,
    note: "Service fees not included. They never are.",
    variant: "card",
  },
  {
    id: "iphone",
    prompt: "Gotta have the new one.",
    name: "Latest iPhone model",
    place: "top of the line",
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
    priceUsd: 1600,
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
    prompt: "Invest in the ride.",
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
    prompt: "The American Dream.",
    name: "Median San Francisco home",
    place: "just the sticker price",
    priceUsd: 1300000,
    icon: KEY,
    note: "Before ~30 years of mortgage interest.",
    variant: "milestone",
  },
  {
    id: "home-south",
    prompt: "The American Dream (in the South).",
    name: "The same house, down South",
    place: "a 3-bed in Tennessee",
    priceUsd: 340000,
    icon: HOUSE,
    note: "A quarter of the SF price — a whole life cheaper.",
    variant: "milestone",
  },
];
