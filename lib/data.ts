/* Demo network for Oracle Go: Colombo to Kandy corridor in the year 2100.
   All data is simulated on the client. No backend is needed. */

export type Mode = "walk" | "bus" | "train" | "air" | "road";
export type Pt = [number, number];

export const MODE_LABEL: Record<Mode, string> = {
  walk: "Walk",
  bus: "Bus",
  train: "Train",
  air: "Air taxi",
  road: "Smart road",
};

export const MODE_IMAGE: Partial<Record<Mode, string>> = {
  bus: "/images/vehicle-bus.svg",
  train: "/images/vehicle-train.svg",
  air: "/images/vehicle-air.svg",
  road: "/images/vehicle-road.svg",
};

export const MODE_ALT: Record<Mode, string> = {
  walk: "A person walking",
  bus: "Illustration of an autonomous bus",
  train: "Illustration of an autonomous maglev train",
  air: "Illustration of an electric air taxi",
  road: "Illustration of an autonomous pod on a smart road",
};

export interface LegDef {
  id: string;
  mode: Mode;
  /** Plain-language instruction for this step. */
  title: string;
  vehicle: string;
  from: string;
  to: string;
  /** Scheduled start, minutes after departure. */
  start: number;
  dur: number;
  path: Pt[];
  /** Where to board, in plain words. */
  spot?: string;
  /** Short reassurance about this step. */
  note: string;
}

export interface RouteDef {
  id: string;
  name: string;
  why: string;
  legs: LegDef[];
  price: number;
  co2: number;
  effort: 1 | 2 | 3;
  effortNote: string;
  walkMeters: number;
  changes: number;
  comfort: { crowd: string; noise: string; seat: string; access: string };
  delay?: { legId: string; minutes: number; chance: number; reason: string };
}

export interface Dest {
  id: string;
  name: string;
  hint: string;
  pos: Pt;
  keywords: string[];
}

export const DESTS: Dest[] = [
  { id: "city", name: "Kandy City Centre", hint: "Market, shops and food", pos: [300, 70], keywords: ["city", "centre", "center", "market", "town", "kandy"] },
  { id: "temple", name: "Temple of the Tooth", hint: "Sacred temple by the lake", pos: [326, 94], keywords: ["temple", "tooth", "dalada", "maligawa"] },
  { id: "gardens", name: "Peradeniya Gardens", hint: "Royal botanical gardens", pos: [236, 108], keywords: ["garden", "gardens", "peradeniya", "botanical", "park"] },
  { id: "lake", name: "Kandy Lake", hint: "A calm walk by the water", pos: [314, 56], keywords: ["lake", "water", "walk"] },
];

export const HOME_NAME = "Home, Dehiwala";
export const DEPART_CLOCK = 8 * 60 + 15; // 8:15 AM demo clock

export function matchDest(text: string): Dest | null {
  const t = text.toLowerCase().trim();
  if (!t) return null;
  const order = ["temple", "gardens", "lake", "city"];
  for (const id of order) {
    const d = DESTS.find((x) => x.id === id)!;
    if (d.keywords.some((k) => t.includes(k))) return d;
  }
  return null;
}

/* ---------- map geometry ---------- */
const HOME: Pt = [58, 522];
const BAY: Pt = [78, 462];
const FORT: Pt = [112, 402];
const FORTSKY: Pt = [70, 384];
const KSTN: Pt = [282, 122];
const KSKY: Pt = [322, 152];

export function arc(a: Pt, b: Pt, lift: number, n = 28): Pt[] {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (dy / len) * lift, cy = my - (dx / len) * lift;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0];
    const y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1];
    pts.push([x, y]);
  }
  return pts;
}

export const MAP_NODES: { key: string; name: string; pos: Pt; short: string }[] = [
  { key: "home", name: "Home", pos: HOME, short: "Home" },
  { key: "fort", name: "Colombo Fort Station", pos: FORT, short: "Fort Station" },
  { key: "fortsky", name: "Fort Sky Port", pos: FORTSKY, short: "Fort Sky Port" },
  { key: "kstn", name: "Kandy Central Station", pos: KSTN, short: "Kandy Station" },
  { key: "ksky", name: "Kandy Sky Port", pos: KSKY, short: "Kandy Sky Port" },
];

/* ---------- route builders ---------- */
function lastMile(from: Pt, dest: Dest, mode: Mode, id: string, start: number, dur: number, vehicle: string, fromName: string): LegDef {
  const mid: Pt = [(from[0] + dest.pos[0]) / 2 - 8, (from[1] + dest.pos[1]) / 2 + 6];
  return {
    id,
    mode,
    title: mode === "walk" ? `Walk to ${dest.name}` : `Ride the pod to ${dest.name}`,
    vehicle,
    from: fromName,
    to: dest.name,
    start,
    dur,
    path: [from, mid, dest.pos],
    spot: mode === "road" ? "Pod bay 3, right outside the station" : undefined,
    note: mode === "road" ? "Your pod is booked. It waits for you and opens its door by itself." : "A gentle, mostly flat walk on a covered path.",
  };
}

const walkToBay: LegDef = {
  id: "walk1",
  mode: "walk",
  title: "Walk to Dehiwala Bus Bay 2",
  vehicle: "On foot",
  from: HOME_NAME,
  to: "Dehiwala Bus Bay 2",
  start: 0,
  dur: 4,
  path: [HOME, [64, 494], [70, 476], BAY],
  note: "A short walk of about 260 metres. The path is flat and covered.",
};

const busToFort: LegDef = {
  id: "bus1",
  mode: "bus",
  title: "Ride Bus 100 to Colombo Fort Station",
  vehicle: "Autonomous Bus 100",
  from: "Dehiwala Bus Bay 2",
  to: "Colombo Fort Station",
  start: 4,
  dur: 14,
  path: [BAY, [84, 440], [96, 420], FORT],
  spot: "Bay 2, front door has a ramp",
  note: "The bus kneels and puts out a ramp for you. Priority seats are near the door.",
};

export function routesFor(dest: Dest): RouteDef[] {
  const easy: RouteDef = {
    id: "easy",
    name: "Calm train route",
    why: "Step-free, seats likely, and plenty of time to change.",
    price: 2400,
    co2: 1.1,
    effort: 1,
    effortNote: "About 260 metres of walking, all step-free",
    walkMeters: 260,
    changes: 2,
    comfort: { crowd: "Quiet", noise: "Quiet", seat: "Seat likely", access: "Step-free the whole way" },
    delay: { legId: "train1", minutes: 12, chance: 82, reason: "A signal fault near Rambukkana is slowing trains on the hill line." },
    legs: [
      walkToBay,
      busToFort,
      {
        id: "train1",
        mode: "train",
        title: "Ride the Maglev train to Kandy Central",
        vehicle: "Maglev Express KX2",
        from: "Colombo Fort Station",
        to: "Kandy Central Station",
        start: 26,
        dur: 62,
        path: [FORT, [150, 350], [180, 300], [210, 250], [240, 190], [262, 150], KSTN],
        spot: "Platform 4, carriage 3 has a level floor",
        note: "A quiet carriage with wide doors and level boarding. Free drinking water on board.",
      },
      lastMile(KSTN, dest, "road", "road1", 91, 9, "Autonomous Pod", "Kandy Central Station"),
    ],
  };

  const fast: RouteDef = {
    id: "fast",
    name: "Sky route",
    why: "Fastest way there. It has a security check and a short wait to board.",
    price: 9800,
    co2: 3.4,
    effort: 2,
    effortNote: "About 400 metres of walking, with a security check",
    walkMeters: 400,
    changes: 2,
    comfort: { crowd: "Moderate", noise: "Normal", seat: "Reserved seat", access: "Lifts and ramps at both sky ports" },
    legs: [
      {
        id: "road0",
        mode: "road",
        title: "Ride the pod to Fort Sky Port",
        vehicle: "Autonomous Pod",
        from: HOME_NAME,
        to: "Fort Sky Port",
        start: 0,
        dur: 12,
        path: [HOME, [62, 470], [66, 430], [68, 410], FORTSKY],
        spot: "Right outside your front door",
        note: "The pod comes to your door and takes the smart-road lane.",
      },
      {
        id: "air1",
        mode: "air",
        title: "Fly by Air taxi to Kandy Sky Port",
        vehicle: "Air Taxi SK7",
        from: "Fort Sky Port",
        to: "Kandy Sky Port",
        start: 25,
        dur: 34,
        path: arc(FORTSKY, KSKY, 60),
        spot: "Gate 2, a lift takes you up",
        note: "A smooth 34 minute flight. Your seat is reserved and there is space for a wheelchair.",
      },
      lastMile(KSKY, dest, "road", "road1", 62, 10, "Autonomous Pod", "Kandy Sky Port"),
    ],
  };

  const green: RouteDef = {
    id: "green",
    name: "Bus and smart road",
    why: "Lowest cost and lowest carbon. It takes longer and has more walking.",
    price: 900,
    co2: 0.6,
    effort: 3,
    effortNote: "About 700 metres of walking, and a long ride",
    walkMeters: 700,
    changes: 2,
    comfort: { crowd: "Busy", noise: "Normal", seat: "Standing likely", access: "Ramps on all buses" },
    legs: [
      walkToBay,
      { ...busToFort, dur: 16, to: "Colombo Fort Bus Hub", title: "Ride Bus 100 to Colombo Fort Bus Hub" },
      {
        id: "bus2",
        mode: "bus",
        title: "Ride Express Bus E1 to Kandy Bus Hub",
        vehicle: "Autonomous Express E1",
        from: "Colombo Fort Bus Hub",
        to: "Kandy Bus Hub",
        start: 28,
        dur: 88,
        path: [FORT, [135, 388], [172, 340], [195, 296], [228, 232], [252, 178], [262, 134], [276, 118]],
        spot: "Bay 7",
        note: "Runs in the smart-road platoon lane, so it does not get stuck in traffic.",
      },
      lastMile(KSTN, dest, "walk", "walk2", 120, 6, "On foot", "Kandy Bus Hub"),
    ],
  };

  return [easy, fast, green];
}

/** The smart alternative offered when a delay is predicted on the calm route. */
export function rebookRoute(dest: Dest): RouteDef {
  return {
    id: "rebook",
    name: "Sky switch",
    why: "Skip the late train and take an air taxi from Fort Sky Port.",
    price: 2400 + 2700,
    co2: 3.0,
    effort: 1,
    effortNote: "Still step-free, with a lift to the gate",
    walkMeters: 180,
    changes: 3,
    comfort: { crowd: "Quiet", noise: "Normal", seat: "Reserved seat", access: "Step-free the whole way" },
    legs: [
      walkToBay,
      { ...busToFort, to: "Colombo Fort Station" },
      {
        id: "road0",
        mode: "road",
        title: "Ride the pod to Fort Sky Port",
        vehicle: "Autonomous Pod",
        from: "Colombo Fort Station",
        to: "Fort Sky Port",
        start: 21,
        dur: 6,
        path: [FORT, [92, 392], FORTSKY],
        spot: "Pod bay 1, next to the station exit",
        note: "Booked for you. It is a 6 minute ride with no stairs.",
      },
      {
        id: "air1",
        mode: "air",
        title: "Fly by Air taxi to Kandy Sky Port",
        vehicle: "Air Taxi SK7",
        from: "Fort Sky Port",
        to: "Kandy Sky Port",
        start: 40,
        dur: 34,
        path: arc(FORTSKY, KSKY, 60),
        spot: "Gate 2, a lift takes you up",
        note: "Your reserved seat has extra legroom.",
      },
      lastMile(KSKY, dest, "road", "road1", 77, 10, "Autonomous Pod", "Kandy Sky Port"),
    ],
  };
}

export function money(n: number) {
  return "Rs\u00A0" + n.toLocaleString("en-US");
}
