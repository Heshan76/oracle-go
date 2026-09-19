import { DEPART_CLOCK, LegDef, Mode, RouteDef } from "./data";

/* ---------- clock helpers ---------- */
export function clock(absMin: number): string {
  const m = ((Math.floor(absMin) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
}
/** Wall-clock time for an offset (minutes after departure). */
export const at = (offset: number) => clock(DEPART_CLOCK + offset);

export function duration(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h} hr` : `${h} hr ${r} min`;
}

export function minutesWord(n: number): string {
  const v = Math.max(0, Math.ceil(n));
  return v === 1 ? "1 minute" : `${v} minutes`;
}

/* ---------- timeline ---------- */
export interface TLeg extends LegDef {
  s: number;
  e: number;
  /** Minutes later than scheduled (0 when on time). */
  late: number;
}
export interface Timeline {
  legs: TLeg[];
  total: number;
  delay: number;
}

export function buildTimeline(route: RouteDef, withDelay: boolean): Timeline {
  let shift = 0;
  let delay = 0;
  const legs = route.legs.map((l) => {
    if (withDelay && route.delay && l.id === route.delay.legId) {
      shift = route.delay.minutes;
      delay = shift;
    }
    const s = l.start + shift;
    return { ...l, s, e: s + l.dur, late: shift };
  });
  return { legs, total: legs[legs.length - 1].e, delay };
}

export type Phase =
  | { kind: "riding"; i: number; frac: number; left: number }
  | { kind: "waiting"; i: number; toStart: number; from: number }
  | { kind: "arrived" };

export function phaseAt(tl: Timeline, t: number): Phase {
  if (t >= tl.total) return { kind: "arrived" };
  for (let i = 0; i < tl.legs.length; i++) {
    const L = tl.legs[i];
    if (t >= L.s && t < L.e) return { kind: "riding", i, frac: (t - L.s) / L.dur, left: L.e - t };
    if (t < L.s) return { kind: "waiting", i, toStart: L.s - t, from: i - 1 };
  }
  return { kind: "arrived" };
}

export function phaseKey(p: Phase): string {
  return p.kind === "arrived" ? "arrived" : `${p.kind}-${p.i}`;
}

/* ---------- trip status (the "Is everything okay?" answer) ---------- */
export type StatusKind = "ontime" | "predicted" | "late" | "rebooked" | "arrived";
export interface Status {
  kind: StatusKind;
  label: string;
  detail: string;
  tone: "ok" | "warn" | "info";
}

export function tripStatus(opts: {
  tl: Timeline;
  route: RouteDef;
  rebooked: boolean;
  decision: "keep" | "switch" | null;
  phase: Phase;
}): Status {
  const { tl, route, rebooked, decision, phase } = opts;
  if (phase.kind === "arrived") return { kind: "arrived", label: "Arrived", detail: "You made it.", tone: "ok" };
  if (rebooked) return { kind: "rebooked", label: "Back on time", detail: "You switched to the air taxi. It is booked.", tone: "ok" };
  if (route.delay && tl.delay > 0) {
    if (decision === "keep")
      return { kind: "late", label: `Train ${tl.delay} min late`, detail: `You will arrive at ${at(tl.total)}.`, tone: "warn" };
    return {
      kind: "predicted",
      label: `Likely ${tl.delay} min late`,
      detail: `Your train will probably run ${tl.delay} minutes late.`,
      tone: "warn",
    };
  }
  return { kind: "ontime", label: "On time", detail: "Everything is running as planned.", tone: "ok" };
}

/* ---------- plain-language descriptions ---------- */
function firstPart(s?: string) {
  return (s || "").split(",")[0];
}

const stopsAway = (m: number) => Math.max(1, Math.round(m / 1.5));

/** How the traveller is travelling, in plain words: "on Bus 100", "in your pod". */
export function aboard(L: LegDef): string {
  switch (L.mode) {
    case "air":
      return "in the air taxi";
    case "road":
      return "in your pod";
    default:
      return `on ${L.vehicle.replace("Autonomous ", "")}`;
  }
}
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export interface Say {
  /** One large sentence: what is happening right now. */
  headline: string;
  /** Where am I? */
  where: string;
  /** What do I do next? */
  next: string;
  /** Short verb-led action for a big button or label. */
  action: string;
}

export function say(tl: Timeline, p: Phase, started: boolean, destName: string): Say {
  if (p.kind === "arrived") {
    return {
      headline: `You have arrived at ${destName}.`,
      where: `At ${destName}`,
      next: "Nothing more to do. Enjoy your day.",
      action: "Trip complete",
    };
  }
  if (p.kind === "riding") {
    const L = tl.legs[p.i];
    const nxt = tl.legs[p.i + 1];
    const left = Math.max(1, Math.ceil(p.left));
    const isLast = p.i === tl.legs.length - 1;
    let headline: string;
    if (!started && p.i === 0) {
      headline = L.mode === "walk" ? `Your journey begins with a ${left} minute walk.` : `Your journey begins ${aboard(L)}.`;
    } else if (L.mode === "walk") {
      headline = isLast
        ? `Nearly there. ${L.to} is a ${left} minute walk.`
        : `Keep walking. ${L.to} is about ${left} ${left === 1 ? "minute" : "minutes"} away.`;
    } else if (isLast) {
      headline = `Almost there. You arrive at ${L.to} in ${left} ${left === 1 ? "minute" : "minutes"}.`;
    } else {
      headline = `You are ${aboard(L)}. Your stop, ${L.to}, is in ${left} ${left === 1 ? "minute" : "minutes"}.`;
    }
    return {
      headline,
      where: L.mode === "walk" ? `Walking to ${L.to}` : cap(aboard(L)),
      next: nxt ? `At ${L.to}: ${nxt.title.charAt(0).toLowerCase() + nxt.title.slice(1)}, leaving ${at(nxt.s)}.` : `You arrive at ${at(L.e)}.`,
      action: L.mode === "walk" ? `Walk to ${L.to}` : `Stay on until ${L.to}`,
    };
  }
  // waiting between legs
  const N = tl.legs[p.i];
  const P = p.from >= 0 ? tl.legs[p.from] : null;
  const m = Math.max(1, Math.ceil(p.toStart));
  const spot = firstPart(N.spot);
  let headline: string;
  switch (N.mode as Mode) {
    case "bus":
      headline = `Your bus is ${stopsAway(p.toStart)} ${stopsAway(p.toStart) === 1 ? "stop" : "stops"} away, arriving in ${minutesWord(m)}.`;
      break;
    case "train":
      headline =
        N.late > 0
          ? `Your train is ${N.late} minutes late. It now leaves at ${at(N.s)} from ${spot}.`
          : m <= 5
          ? `Your train leaves in ${minutesWord(m)} from ${spot}. Walk there now.`
          : `Your train leaves in ${minutesWord(m)} from ${spot}. You have time to rest.`;
      break;
    case "air":
      headline = `Your air taxi boards in ${minutesWord(m)}. Go to ${spot}.`;
      break;
    case "road":
      headline = `Your pod arrives in ${minutesWord(m)} at ${spot}.`;
      break;
    default:
      headline = `Walk to ${N.to} when you are ready.`;
  }
  return {
    headline,
    where: P ? `At ${P.to}, changing vehicles` : "Getting ready to start",
    next: `${N.title}, leaving ${at(N.s)}.`,
    action: `Go to ${spot || N.from}`,
  };
}

/* ---------- transfer coach ---------- */
const WALK_NEEDED: Record<Mode, number> = { walk: 0, bus: 2, road: 1, train: 3, air: 8 };

export interface Coach {
  index: number;
  place: string;
  buffer: number;
  walk: number;
  tone: "ok" | "tight" | "risk";
  headline: string;
  detail: string;
  /** 0..1, how much of the buffer is spare time. */
  spare: number;
}

export function coachFor(tl: Timeline, p: Phase): Coach | null {
  if (p.kind === "arrived") return null;
  let N = p.kind === "riding" ? p.i + 1 : p.i;
  // A real change is vehicle to vehicle. Walking to your first stop is not a change.
  while (N < tl.legs.length && !(N >= 1 && tl.legs[N].mode !== "walk" && tl.legs[N - 1].mode !== "walk")) N++;
  if (N >= tl.legs.length) return null;
  const prev = tl.legs[N - 1];
  const next = tl.legs[N];
  const buffer = Math.max(0, next.s - prev.e);
  const walk = WALK_NEEDED[next.mode];
  const spareMin = buffer - walk;
  let tone: Coach["tone"] = "ok";
  let headline = "";
  let detail = "";
  if (spareMin >= 2) {
    tone = "ok";
    headline = `You have ${minutesWord(buffer)} to change. You are fine.`;
    detail =
      next.late > 0
        ? `Because the train is late, you have extra time. Walking to ${firstPart(next.spot)} takes about ${minutesWord(walk)}, so there is time for a drink.`
        : `Walking to ${firstPart(next.spot)} takes about ${minutesWord(walk)}. Take your time.`;
  } else if (spareMin >= 0) {
    tone = "tight";
    headline = `You have ${minutesWord(buffer)} to change. It is a little tight.`;
    detail = `Walking to ${firstPart(next.spot)} takes about ${minutesWord(walk)}. Head straight there when you arrive.`;
  } else {
    tone = "risk";
    headline = `Only ${minutesWord(buffer)} to change. Move quickly.`;
    detail = `Tap Help and we will find you the next option.`;
  }
  return {
    index: N,
    place: prev.to,
    buffer,
    walk,
    tone,
    headline,
    detail,
    spare: Math.max(0, Math.min(1, spareMin / Math.max(1, buffer))),
  };
}

/* ---------- geometry helpers for the map ---------- */
export type P2 = [number, number];

export function polyLength(pts: P2[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

export function pointAlong(pts: P2[], f: number): P2 {
  const total = polyLength(pts);
  let target = Math.max(0, Math.min(1, f)) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (target <= seg || i === pts.length - 1) {
      const k = seg === 0 ? 0 : Math.min(1, target / seg);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    }
    target -= seg;
  }
  return pts[pts.length - 1];
}

export function slicePath(pts: P2[], f: number): P2[] {
  const total = polyLength(pts);
  const target = Math.max(0, Math.min(1, f)) * total;
  const out: P2[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= target) {
      const k = seg === 0 ? 0 : (target - acc) / seg;
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]);
      return out;
    }
    out.push(pts[i]);
    acc += seg;
  }
  return out;
}

export const ptsToStr = (pts: P2[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
