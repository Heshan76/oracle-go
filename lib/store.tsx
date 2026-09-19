"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DESTS, Dest, RouteDef, rebookRoute, routesFor } from "./data";
import { Coach, Phase, Say, Status, Timeline, buildTimeline, coachFor, phaseAt, phaseKey, say, tripStatus } from "./trip";

/* ---------- comfort profile ---------- */
export type Prefer = "easiest" | "fastest" | "cheapest" | "greenest";

export interface Profile {
  textSize: "standard" | "large" | "xlarge";
  contrast: "normal" | "strong";
  input: "either" | "voice" | "tap";
  view: "map" | "text";
  vibrate: boolean;
  sound: boolean;
  readAloud: boolean;
  prefer: Prefer;
  bigButtons: boolean;
  done: boolean;
}

export const DEFAULT_PROFILE: Profile = {
  textSize: "standard",
  contrast: "normal",
  input: "either",
  view: "map",
  vibrate: true,
  sound: false,
  readAloud: false,
  prefer: "easiest",
  bigButtons: false,
  done: false,
};

/* ---------- trip ---------- */
export interface Trip {
  destId: string | null;
  routeId: string | null;
  rebooked: boolean;
  decision: "keep" | "switch" | null;
  started: boolean;
  paused: boolean;
  simMin: number;
  sharing: boolean;
  arrivalSent: boolean;
}

const DEFAULT_TRIP: Trip = {
  destId: null,
  routeId: null,
  rebooked: false,
  decision: null,
  started: false,
  paused: false,
  simMin: 0,
  sharing: false,
  arrivalSent: false,
};

const PROFILE_KEY = "oracle-go-profile-v1";
const TRIP_KEY = "oracle-go-trip-v1";
/** Simulated minutes that pass every 250 ms. 0.4 means a 100 minute trip takes about a minute. */
const SIM_STEP = 0.4;

type ToastTone = "info" | "ok" | "warn";
interface ToastMsg {
  id: number;
  msg: string;
  tone: ToastTone;
}

/* ---------- multi-sense alert helpers ---------- */
function beep() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 240);
  } catch {
    /* sound is optional */
  }
}

export function speak(text: string) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    /* read aloud is optional */
  }
}

/* ---------- context ---------- */
interface Ctx {
  ready: boolean;
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;
  trip: Trip;
  dest: Dest | null;
  routes: RouteDef[];
  route: RouteDef | null;
  tl: Timeline | null;
  phase: Phase | null;
  status: Status | null;
  said: Say | null;
  coach: Coach | null;
  chooseDest: (id: string) => void;
  chooseRoute: (id: string) => void;
  startTrip: () => void;
  togglePause: () => void;
  skip: (min: number) => void;
  resetTrip: () => void;
  decide: (d: "keep" | "switch") => void;
  setSharing: (b: boolean) => void;
  toast: ToastMsg | null;
  notify: (msg: string, tone?: ToastTone) => void;
  clearToast: () => void;
  helpOpen: boolean;
  setHelpOpen: (b: boolean) => void;
  bigOffer: boolean;
  answerBigOffer: (accept: boolean) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [trip, setTrip] = useState<Trip>(DEFAULT_TRIP);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [bigOffer, setBigOffer] = useState(false);

  const profileRef = useRef(profile);
  profileRef.current = profile;
  const offerSeen = useRef(false);

  /* load saved state once */
  useEffect(() => {
    try {
      const p = localStorage.getItem(PROFILE_KEY);
      if (p) setProfileState({ ...DEFAULT_PROFILE, ...JSON.parse(p) });
      const t = localStorage.getItem(TRIP_KEY);
      if (t) setTrip({ ...DEFAULT_TRIP, ...JSON.parse(t) });
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  /* apply comfort profile to the whole page */
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.text = profile.textSize;
    el.dataset.contrast = profile.contrast;
    el.dataset.tap = profile.bigButtons ? "large" : "standard";
  }, [profile.textSize, profile.contrast, profile.bigButtons]);

  /* save */
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      /* storage can be blocked */
    }
  }, [profile, ready]);

  const tripKey = JSON.stringify({ ...trip, simMin: Math.floor(trip.simMin) });
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(TRIP_KEY, tripKey);
    } catch {
      /* ignore */
    }
  }, [tripKey, ready]);

  /* derived journey state */
  const dest = useMemo(() => DESTS.find((d) => d.id === trip.destId) ?? null, [trip.destId]);
  const routes = useMemo(() => (dest ? routesFor(dest) : []), [dest]);
  const route = useMemo<RouteDef | null>(() => {
    if (!dest || !trip.routeId) return null;
    if (trip.rebooked) return rebookRoute(dest);
    return routes.find((r) => r.id === trip.routeId) ?? null;
  }, [dest, routes, trip.routeId, trip.rebooked]);
  const tl = useMemo(() => (route ? buildTimeline(route, !trip.rebooked) : null), [route, trip.rebooked]);
  const phase = useMemo(() => (tl ? phaseAt(tl, trip.simMin) : null), [tl, trip.simMin]);
  const status = useMemo(
    () => (tl && route && phase ? tripStatus({ tl, route, rebooked: trip.rebooked, decision: trip.decision, phase }) : null),
    [tl, route, phase, trip.rebooked, trip.decision],
  );
  const said = useMemo(() => (tl && phase && dest ? say(tl, phase, trip.started, dest.name) : null), [tl, phase, dest, trip.started]);
  const coach = useMemo(() => (tl && phase ? coachFor(tl, phase) : null), [tl, phase]);

  /* alerts */
  const notify = useCallback((msg: string, tone: ToastTone = "info") => {
    setToast({ id: Date.now(), msg, tone });
    const p = profileRef.current;
    try {
      if (p.vibrate && "vibrate" in navigator) navigator.vibrate([120, 60, 120]);
    } catch {
      /* vibration is optional */
    }
    if (p.sound) beep();
    if (p.readAloud) speak(msg);
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  /* simulation clock */
  const totalRef = useRef(0);
  totalRef.current = tl?.total ?? 0;
  useEffect(() => {
    if (!trip.started || trip.paused || !tl) return;
    const id = setInterval(() => {
      setTrip((t) => {
        if (!t.started || t.paused) return t;
        const total = totalRef.current;
        if (t.simMin >= total) return t;
        return { ...t, simMin: Math.min(total, t.simMin + SIM_STEP) };
      });
    }, 250);
    return () => clearInterval(id);
  }, [trip.started, trip.paused, tl]);

  /* speak up when the situation changes */
  const pkey = phase ? phaseKey(phase) : null;
  const saidRef = useRef(said);
  saidRef.current = said;
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (!trip.started || !pkey) {
      lastKey.current = null;
      return;
    }
    if (lastKey.current === null) {
      lastKey.current = pkey;
      return;
    }
    if (lastKey.current !== pkey) {
      lastKey.current = pkey;
      if (saidRef.current) notify(saidRef.current.headline, pkey === "arrived" ? "ok" : "info");
    }
  }, [pkey, trip.started, notify]);

  /* arrival message for the trusted circle */
  useEffect(() => {
    if (phase?.kind === "arrived" && trip.started && trip.sharing && !trip.arrivalSent) {
      setTrip((t) => ({ ...t, arrivalSent: true }));
      notify("Sent to Amma: \"I have arrived safely.\"", "ok");
    }
  }, [phase, trip.started, trip.sharing, trip.arrivalSent, notify]);

  /* adaptive help: notice repeated near-miss taps and offer bigger buttons */
  useEffect(() => {
    const hits: number[] = [];
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || el.closest('button,a,input,select,textarea,label,summary,[role="button"],[role="switch"],[data-ok-tap]')) return;
      const x = e.clientX, y = e.clientY;
      let near = false;
      document.querySelectorAll<HTMLElement>('button,a[href],[role="button"]').forEach((n) => {
        if (near) return;
        const r = n.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const dx = Math.max(r.left - x, 0, x - r.right);
        const dy = Math.max(r.top - y, 0, y - r.bottom);
        if (Math.hypot(dx, dy) <= 34) near = true;
      });
      if (!near) return;
      const now = Date.now();
      hits.push(now);
      while (hits.length && now - hits[0] > 12000) hits.shift();
      if (hits.length >= 3 && !profileRef.current.bigButtons && !offerSeen.current) {
        offerSeen.current = true;
        hits.length = 0;
        setBigOffer(true);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /* actions */
  const setProfile = useCallback((p: Partial<Profile>) => setProfileState((prev) => ({ ...prev, ...p })), []);
  const chooseDest = useCallback((id: string) => setTrip({ ...DEFAULT_TRIP, destId: id, sharing: false }), []);
  const chooseRoute = useCallback(
    (id: string) => setTrip((t) => ({ ...t, routeId: id, rebooked: false, decision: null, started: false, paused: false, simMin: 0, arrivalSent: false })),
    [],
  );
  const startTrip = useCallback(() => {
    setTrip((t) => ({ ...t, started: true, paused: false }));
    notify("Your journey has started. We will guide you step by step.", "ok");
  }, [notify]);
  const togglePause = useCallback(() => setTrip((t) => ({ ...t, paused: !t.paused })), []);
  const skip = useCallback((min: number) => setTrip((t) => ({ ...t, simMin: Math.min(totalRef.current, t.simMin + min) })), []);
  const resetTrip = useCallback(() => setTrip(DEFAULT_TRIP), []);
  const decide = useCallback((d: "keep" | "switch") => {
    setTrip((t) => (d === "switch" ? { ...t, decision: "switch", rebooked: true } : { ...t, decision: "keep" }));
  }, []);
  const setSharing = useCallback((b: boolean) => setTrip((t) => ({ ...t, sharing: b, arrivalSent: b ? t.arrivalSent : false })), []);
  const answerBigOffer = useCallback((accept: boolean) => {
    setBigOffer(false);
    if (accept) {
      setProfileState((p) => ({ ...p, bigButtons: true }));
      notify("Done. Buttons are now bigger. You can change this in Comfort.", "ok");
    }
  }, [notify]);

  const value: Ctx = {
    ready, profile, setProfile, trip, dest, routes, route, tl, phase, status, said, coach,
    chooseDest, chooseRoute, startTrip, togglePause, skip, resetTrip, decide, setSharing,
    toast, notify, clearToast, helpOpen, setHelpOpen, bigOffer, answerBigOffer,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
