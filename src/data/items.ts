// The catalog of goods, in narrative order — a day in San Francisco that
// escalates from a $6 coffee to a $26k car. Each carries a playful prompt and a
// `variant` that picks how the card renders, so the section reads as an
// editorial sequence rather than a uniform grid.

export type ItemVariant = "ribbon" | "card" | "feature" | "hero";

export type Item = {
  id: string;
  prompt: string; // the conversational hook
  name: string;
  place: string; // where / what kind, shown smaller
  priceUsd: number;
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
    id: "rent",
    prompt: "Rent day.",
    name: "One month, 1-bed",
    place: "in San Francisco",
    priceUsd: 3300,
    icon: HOUSE,
    variant: "feature",
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
];
