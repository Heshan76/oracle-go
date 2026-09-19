"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Circle, FastForward, HeartHandshake, List, Map as MapIcon, Pause, Play, RotateCcw, User } from "lucide-react";
import { TopBar } from "@/components/Nav";
import TransitMap from "@/components/TransitMap";
import { EmptyState, ModeBadge, StatusPill } from "@/components/ui";
import { useApp } from "@/lib/store";
import { at, duration } from "@/lib/trip";

const SCALE = { standard: 1, large: 1.2, xlarge: 1.35 } as const;

export default function TrackPage() {
  const { ready, dest, route, tl, phase, status, said, trip, profile, startTrip, togglePause, skip, chooseRoute, setSharing } = useApp();
  const [view, setView] = useState<"map" | "text">("map");

  useEffect(() => {
    if (ready) setView(profile.view);
  }, [ready, profile.view]);

  if (!ready) {
    return (
      <>
        <TopBar title="Live tracking" back="/journey" />
        <main className="main">
          <div className="card skeleton" aria-busy="true" aria-label="Loading" />
        </main>
      </>
    );
  }

  if (!dest || !route || !tl || !phase || !status || !said) {
    return (
      <>
        <TopBar title="Live tracking" back="/" />
        <main className="main">
          <EmptyState title="Nothing to track yet" body="Plan a journey first. Then this screen shows where you are, in words and on a map." href="/" cta="Plan a journey" />
        </main>
      </>
    );
  }

  const arrived = phase.kind === "arrived";
  const nowIdx = arrived ? tl.legs.length - 1 : phase.i;
  const left = Math.max(0, Math.ceil(tl.total - trip.simMin));
  const risk = route.delay && !trip.rebooked ? "Signal fault" : null;

  return (
    <>
      <TopBar title="Live tracking" back="/journey" />
      <main className="main">
        {/* Plain-language banner: the map's text twin */}
        <section className={`card banner banner-${status.tone}`} aria-live="polite" aria-atomic="true" aria-label="Where you are">
          <p className="banner-text">{trip.started || arrived ? said.headline : "Your journey has not started yet. Tap Start when you leave home."}</p>
          <div className="banner-foot">
            <div>
              <p className="small-label">Arriving</p>
              <p className="banner-eta">{at(tl.total)}</p>
            </div>
            <div>
              <p className="small-label">Time left</p>
              <p className="banner-eta">{arrived ? "0 min" : duration(left)}</p>
            </div>
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
          </div>
        </section>

        {!trip.started && !arrived ? (
          <button type="button" className="btn btn-primary btn-block" onClick={startTrip}>
            <Play size={22} aria-hidden="true" />
            Start my journey
          </button>
        ) : null}

        <div className="seg" role="radiogroup" aria-label="How to see your journey">
          <button type="button" role="radio" aria-checked={view === "map"} className={view === "map" ? "seg-on" : ""} onClick={() => setView("map")}>
            <MapIcon size={22} aria-hidden="true" />
            Map
          </button>
          <button type="button" role="radio" aria-checked={view === "text"} className={view === "text" ? "seg-on" : ""} onClick={() => setView("text")}>
            <List size={22} aria-hidden="true" />
            Text steps
          </button>
        </div>

        {view === "map" ? (
          <section className="map-wrap" aria-label="Map">
            <TransitMap tl={tl} phase={phase} started={trip.started} labelScale={SCALE[profile.textSize]} destName={dest.name} riskLabel={risk} />
            <ul className="legend" aria-label="Map key">
              <li>
                <span className="key key-you" aria-hidden="true">
                  <User size={14} />
                </span>
                You, on foot
              </li>
              <li>
                <span className="key key-veh" aria-hidden="true" />
                You, in a vehicle
              </li>
              <li>
                <span className="key key-veh key-dash" aria-hidden="true" />
                Vehicle on its way
              </li>
              <li>
                <span className="key key-stop" aria-hidden="true" />
                Stop
              </li>
            </ul>
          </section>
        ) : (
          <section aria-label="Journey steps as text">
            <ol className="steps">
              {tl.legs.map((l, i) => {
                const state = arrived || i < nowIdx ? "done" : i === nowIdx ? "now" : i === nowIdx + 1 ? "next" : "later";
                return (
                  <li key={l.id} className={`step step-${state}`} aria-current={state === "now" ? "step" : undefined}>
                    <span className="step-mark" aria-hidden="true">
                      {state === "done" ? <Check size={18} strokeWidth={3} /> : <Circle size={10} fill="currentColor" />}
                    </span>
                    <div className="step-body">
                      <div className="step-top">
                        <ModeBadge mode={l.mode} size={40} />
                        <div>
                          <strong>{l.title}</strong>
                          <small>
                            {at(l.s)} to {at(l.e)}
                          </small>
                        </div>
                      </div>
                      <p className="step-state">
                        {state === "done" ? "Done" : state === "now" ? (phase.kind === "waiting" ? "Get ready for this" : "You are here now") : state === "next" ? "Next" : "Later"}
                        {l.late > 0 && state !== "done" ? `, ${l.late} minutes late` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {!arrived ? (
          <section className="card next-up" aria-label="What happens next">
            <p className="small-label">What happens next</p>
            <p className="next-text">{said.next}</p>
          </section>
        ) : (
          <Link href="/arrived" className="btn btn-primary btn-block">
            See my trip summary
          </Link>
        )}

        <div className="two-btns">
          <Link href="/boarding" className="btn btn-secondary">
            Boarding pass
          </Link>
          <Link href="/journey" className="btn btn-secondary">
            Journey details
          </Link>
        </div>

        {/* Trusted circle */}
        <label className="card switch-card">
          <span className="switch-text">
            <HeartHandshake size={26} aria-hidden="true" />
            <span>
              <strong>Share my trip with Amma</strong>
              <small>{trip.sharing ? "On. Amma can see where you are and will get an arrival message." : "Off. Turn on so Amma can follow your journey."}</small>
            </span>
          </span>
          <input type="checkbox" role="switch" className="switch" checked={trip.sharing} onChange={(e) => setSharing(e.target.checked)} />
        </label>

        <details className="card demo">
          <summary>Demo controls</summary>
          <p className="demo-note">These controls help you test the app quickly. A real trip would not have them.</p>
          <div className="demo-grid">
            <button type="button" className="btn btn-secondary" onClick={togglePause} disabled={!trip.started || arrived}>
              {trip.paused ? <Play size={20} aria-hidden="true" /> : <Pause size={20} aria-hidden="true" />}
              {trip.paused ? "Resume" : "Pause"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => skip(10)} disabled={!trip.started || arrived}>
              <FastForward size={20} aria-hidden="true" />
              Skip 10 minutes
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => trip.routeId && chooseRoute(trip.routeId)}>
              <RotateCcw size={20} aria-hidden="true" />
              Restart this trip
            </button>
          </div>
        </details>
      </main>
    </>
  );
}
