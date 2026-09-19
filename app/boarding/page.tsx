"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Maximize2, Minimize2 } from "lucide-react";
import { TopBar } from "@/components/Nav";
import BoardingCode from "@/components/BoardingCode";
import { EmptyState, ModeBadge, StatusPill } from "@/components/ui";
import { useApp } from "@/lib/store";
import { at, minutesWord } from "@/lib/trip";

function seatFor(mode: string) {
  if (mode === "train") return "Seat 14A, reserved for you";
  if (mode === "air") return "Seat 2B, extra legroom";
  if (mode === "road") return "A private pod, just for you";
  return "Any free seat. Priority seats are near the door";
}

export default function BoardingPage() {
  const { ready, dest, route, tl, phase, trip } = useApp();
  const [big, setBig] = useState(false);

  if (!ready) {
    return (
      <>
        <TopBar title="Boarding pass" back="/journey" />
        <main className="main">
          <div className="card skeleton" aria-busy="true" aria-label="Loading" />
        </main>
      </>
    );
  }

  if (!dest || !route || !tl || !phase) {
    return (
      <>
        <TopBar title="Boarding pass" back="/" />
        <main className="main">
          <EmptyState title="No boarding pass yet" body="Choose a route and your one pass will appear here. It works on every bus, train, air taxi and pod." href="/" cta="Plan a journey" />
        </main>
      </>
    );
  }

  const arrived = phase.kind === "arrived";
  const startFrom = arrived ? tl.legs.length : phase.kind === "riding" ? phase.i + 1 : phase.i;
  const onBoardNow = phase.kind === "riding" && trip.started && tl.legs[phase.i].mode !== "walk" ? tl.legs[phase.i] : null;
  let target = tl.legs.findIndex((l, i) => i >= startFrom && l.mode !== "walk");
  // Before the trip starts, show the first vehicle.
  if (!trip.started && !arrived) target = tl.legs.findIndex((l) => l.mode !== "walk");
  const N = target >= 0 ? tl.legs[target] : null;
  const mins = N ? N.s - trip.simMin : 0;
  const ready6 = !!N && trip.started && mins <= 6;
  const vehicles = tl.legs.filter((l) => l.mode !== "walk");

  return (
    <>
      <TopBar title="Boarding pass" back="/journey" />
      <main className="main">
        <section className="card pass" aria-labelledby="pass-title">
          {arrived ? (
            <>
              <h2 id="pass-title">Trip complete</h2>
              <p>Your pass has been used on every step. Thank you for travelling with Oracle Go.</p>
            </>
          ) : (
            <>
              <div className="pass-head">
                <h2 id="pass-title">{N ? N.vehicle : "Your pass"}</h2>
                {ready6 ? <StatusPill tone="ok">Ready to board</StatusPill> : <StatusPill tone="info">{trip.started ? "Not boarding yet" : "Journey not started"}</StatusPill>}
              </div>
              <p className="pass-say" aria-live="polite">
                {onBoardNow && !ready6
                  ? `You are on ${onBoardNow.vehicle} now. Your next pass is below.`
                  : ready6
                  ? "Hold this code near the reader. The door opens by itself."
                  : N
                  ? `Boarding opens 6 minutes before departure. This one leaves at ${at(N.s)}.`
                  : "No more vehicles to board."}
              </p>
              <div className="code-box">
                <BoardingCode seed={`${route.id}-${N?.id ?? "x"}`} size={big ? 300 : 220} />
              </div>
              <p className="demo-code">Demo code. It stands in for a real one.</p>
              <button type="button" className="btn btn-secondary btn-block" onClick={() => setBig((b) => !b)} aria-pressed={big}>
                {big ? <Minimize2 size={22} aria-hidden="true" /> : <Maximize2 size={22} aria-hidden="true" />}
                {big ? "Make the code smaller" : "Make the code bigger"}
              </button>
              {N ? (
                <dl className="pass-details">
                  <div>
                    <dt>Where to board</dt>
                    <dd>{N.spot ?? N.from}</dd>
                  </div>
                  <div>
                    <dt>Leaves</dt>
                    <dd>
                      {at(N.s)}
                      {N.late > 0 ? `, ${N.late} minutes late` : ""}
                      {trip.started && mins > 0 ? ` (in ${minutesWord(mins)})` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>Your seat</dt>
                    <dd>{seatFor(N.mode)}</dd>
                  </div>
                </dl>
              ) : null}
            </>
          )}
        </section>

        <section className="card" aria-labelledby="works-title">
          <h2 id="works-title" className="card-title">
            One pass for every step
          </h2>
          <ul className="pass-list">
            {vehicles.map((l) => (
              <li key={l.id}>
                <ModeBadge mode={l.mode} size={40} />
                <div>
                  <strong>{l.vehicle}</strong>
                  <small>
                    {l.from} to {l.to}
                  </small>
                </div>
                <Check size={22} strokeWidth={3} className="pass-check" aria-label="Included" />
              </li>
            ))}
          </ul>
        </section>

        <Link href="/journey" className="btn btn-primary btn-block">
          Back to my journey
        </Link>
      </main>
    </>
  );
}
