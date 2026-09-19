"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, ChevronRight, Landmark, MapPin, Mic, Navigation, Search, TreePine, Waves } from "lucide-react";
import { TopBar } from "@/components/Nav";
import VoiceSheet from "@/components/VoiceSheet";
import { VehicleArt } from "@/components/ui";
import { DESTS, Dest, HOME_NAME, MODE_LABEL, matchDest } from "@/lib/data";
import { useApp } from "@/lib/store";
import { at } from "@/lib/trip";

const DEST_ICON = { city: Building2, temple: Landmark, gardens: TreePine, lake: Waves } as const;

const WAYS = [
  { mode: "bus" as const, title: "Autonomous buses", text: "Ramps and priority seats" },
  { mode: "train" as const, title: "Maglev trains", text: "Level boarding, quiet cars" },
  { mode: "air" as const, title: "Air taxis", text: "Lift to the gate" },
  { mode: "road" as const, title: "Smart-road pods", text: "Door to door" },
];

export default function HomePage() {
  const router = useRouter();
  const { profile, chooseDest, route, trip, phase, dest, tl } = useApp();
  const [text, setText] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const suggestions = useMemo(() => {
    const t = text.trim().toLowerCase();
    if (t.length < 2) return [];
    return DESTS.filter((d) => d.name.toLowerCase().includes(t) || d.keywords.some((k) => k.startsWith(t) || t.includes(k))).slice(0, 4);
  }, [text]);

  const go = (d: Dest) => {
    setVoiceOpen(false);
    chooseDest(d.id);
    router.push("/routes");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) {
      setMsg("Type a place, say it out loud, or tap one of the places below.");
      return;
    }
    const d = matchDest(t);
    if (d) go(d);
    else setMsg("I do not know that place yet. In this demo you can travel to Kandy. Tap one of the places below.");
  };

  const voiceFirst = profile.input === "voice";
  const showMic = profile.input !== "tap";
  const inProgress = route && dest && tl && trip.started && phase && phase.kind !== "arrived";

  return (
    <>
      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-art" src="/images/hero-city.svg" alt="" width={390} height={330} />
        <TopBar dark brand />
        <div className="hero-copy">
          <h1>Where would you like to go?</h1>
          <p>Buses, trains, air taxis and smart roads, all in one simple plan.</p>
        </div>
      </section>

      <main className="main main-lift">
        <form className="card search" onSubmit={submit} noValidate>
          <div className="from-row">
            <span className="from-icon" aria-hidden="true">
              <MapPin size={22} />
            </span>
            <div className="from-text">
              <span className="small-label">From</span>
              <strong>{HOME_NAME}</strong>
            </div>
            <span className="tag">Leave now, {at(0)}</span>
          </div>

          <label htmlFor="to" className="field-label">
            Where to?
          </label>
          <div className="field">
            <Search size={22} aria-hidden="true" />
            <input
              id="to"
              type="text"
              inputMode="search"
              autoComplete="off"
              autoCorrect="off"
              placeholder="Try Temple of the Tooth"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setMsg(null);
              }}
              aria-describedby={msg ? "search-msg" : undefined}
            />
          </div>

          {suggestions.length > 0 ? (
            <ul className="suggest" aria-label="Suggested places">
              {suggestions.map((d) => (
                <li key={d.id}>
                  <button type="button" onClick={() => go(d)}>
                    <MapPin size={20} aria-hidden="true" />
                    <span>
                      <strong>{d.name}</strong>
                      <small>{d.hint}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {msg ? (
            <p id="search-msg" className="form-msg" role="alert">
              {msg}
            </p>
          ) : null}

          <div className={`search-actions ${voiceFirst ? "voice-first" : ""}`}>
            {showMic ? (
              <button type="button" className={`btn ${voiceFirst ? "btn-primary" : "btn-secondary"}`} onClick={() => setVoiceOpen(true)}>
                <Mic size={22} aria-hidden="true" />
                Speak
              </button>
            ) : null}
            <button type="submit" className={`btn ${voiceFirst ? "btn-secondary" : "btn-primary"}`}>
              Find routes
            </button>
          </div>
        </form>

        {inProgress ? (
          <section className="card resume" aria-label="Trip in progress">
            <div>
              <h2>Your trip to {dest!.name} is under way</h2>
              <p>You arrive at {at(tl!.total)}.</p>
            </div>
            <Link href="/track" className="btn btn-primary btn-block">
              <Navigation size={22} aria-hidden="true" />
              Open live map
            </Link>
          </section>
        ) : null}

        {!profile.done && !dismissed ? (
          <section className="card comfort-card" aria-labelledby="cc-title">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/people.svg" alt="Illustration of an older person, a wheelchair user, a parent with a child, a teenager and a traveller with a bag, all waiting together" width={360} height={190} />
            <h2 id="cc-title">Make Oracle Go comfortable for you</h2>
            <p>Three quick questions set the text size, colours and how you like to ask. It takes about 30 seconds.</p>
            <div className="stack">
              <Link href="/onboarding" className="btn btn-primary btn-block">
                Set up my comfort
              </Link>
              <button type="button" className="btn btn-quiet btn-block" onClick={() => setDismissed(true)}>
                Not now
              </button>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="pp-title" className="block">
          <h2 id="pp-title" className="section-title">
            Popular places
          </h2>
          <div className="tiles">
            {DESTS.map((d) => {
              const Icon = DEST_ICON[d.id as keyof typeof DEST_ICON];
              return (
                <button key={d.id} type="button" className="tile" onClick={() => go(d)}>
                  <span className="tile-icon" aria-hidden="true">
                    <Icon size={26} />
                  </span>
                  <strong>{d.name}</strong>
                  <small>{d.hint}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="ways-title" className="block">
          <h2 id="ways-title" className="section-title">
            One plan, every way to travel
          </h2>
          <p className="section-sub">Oracle Go joins them together, so you never juggle separate apps or tickets.</p>
          <ul className="ways">
            {WAYS.map((w) => (
              <li key={w.mode} className="way">
                <VehicleArt mode={w.mode} />
                <strong>{w.title}</strong>
                <small>{w.text}</small>
                <span className="sr-only">Mode: {MODE_LABEL[w.mode]}</span>
              </li>
            ))}
          </ul>
        </section>
        <Link href="/onboarding" className="linkrow">
          <span>Change text size, colours or how you ask</span>
          <ChevronRight size={22} aria-hidden="true" />
        </Link>
      </main>

      <VoiceSheet open={voiceOpen} onClose={() => setVoiceOpen(false)} onPick={go} />
    </>
  );
}
