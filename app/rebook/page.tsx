"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { CircleCheck, Sparkles } from "lucide-react";
import { TopBar } from "@/components/Nav";
import { EffortMeter, EmptyState, VehicleArt } from "@/components/ui";
import { rebookRoute } from "@/lib/data";
import { useApp } from "@/lib/store";
import { at, buildTimeline } from "@/lib/trip";

export default function RebookPage() {
  const router = useRouter();
  const { ready, dest, routes, trip, decide } = useApp();

  const orig = useMemo(() => routes.find((r) => r.id === trip.routeId) ?? null, [routes, trip.routeId]);
  const alt = useMemo(() => (dest ? rebookRoute(dest) : null), [dest]);
  const origTl = useMemo(() => (orig ? buildTimeline(orig, true) : null), [orig]);
  const altTl = useMemo(() => (alt ? buildTimeline(alt, false) : null), [alt]);

  if (!ready) {
    return (
      <>
        <TopBar title="Stay on time" back="/journey" />
        <main className="main">
          <div className="card skeleton" aria-busy="true" aria-label="Loading" />
        </main>
      </>
    );
  }

  if (!dest || !orig || !alt || !origTl || !altTl) {
    return (
      <>
        <TopBar title="Stay on time" back="/" />
        <main className="main">
          <EmptyState title="No trip to change" body="Pick a route first. If anything runs late, your options will appear here." href="/" cta="Plan a journey" />
        </main>
      </>
    );
  }

  if (!orig.delay) {
    return (
      <>
        <TopBar title="Stay on time" back="/journey" />
        <main className="main">
          <section className="card success-card">
            <h2>Nothing to fix</h2>
            <p>Your journey is on track. If something runs late, we will offer you a better option here.</p>
          </section>
          <Link href="/journey" className="btn btn-primary btn-block">
            Back to my journey
          </Link>
        </main>
      </>
    );
  }

  if (trip.rebooked) {
    return (
      <>
        <TopBar title="Stay on time" back="/journey" />
        <main className="main">
          <section className="card done" aria-live="polite">
            <span className="done-icon" aria-hidden="true">
              <CircleCheck size={40} />
            </span>
            <h2>Done. You have switched.</h2>
            <p className="big-line">You now arrive at {at(altTl.total)}.</p>
            <ul className="checks">
              <li>Your train ticket is cancelled and Rs 1,200 goes back to you.</li>
              <li>A pod will meet you at Colombo Fort Station, pod bay 1.</li>
              <li>Your air taxi seat is reserved at Gate 2, with a lift.</li>
              <li>Your boarding pass is updated. Nothing to do.</li>
              {trip.sharing ? <li>Amma has been told your new arrival time.</li> : null}
            </ul>
          </section>
          <Link href="/journey" className="btn btn-primary btn-block">
            Back to my journey
          </Link>
          <Link href="/track" className="btn btn-secondary btn-block">
            Open live map
          </Link>
        </main>
      </>
    );
  }

  const saved = origTl.total - altTl.total;
  const earlier = orig.legs[orig.legs.length - 1].start + orig.legs[orig.legs.length - 1].dur - altTl.total;

  return (
    <>
      <TopBar title="Stay on time" back="/journey" />
      <main className="main">
        <section className="card why" aria-labelledby="why-title">
          <div className="alert-head">
            <span className="alert-icon" aria-hidden="true">
              <Sparkles size={24} />
            </span>
            <h2 id="why-title">Your train will probably be {orig.delay.minutes} minutes late</h2>
          </div>
          <p>{orig.delay.reason}</p>
          <p className="chance">
            <span className="chance-bar" aria-hidden="true">
              <i style={{ width: `${orig.delay.chance}%` }} />
            </span>
            I am {orig.delay.chance}% sure. Here are your two choices.
          </p>
        </section>

        <section className="card option option-best" aria-labelledby="opt-a">
          <p className="ribbon">
            <Sparkles size={18} aria-hidden="true" />
            Recommended
          </p>
          <VehicleArt mode="air" />
          <h2 id="opt-a">Switch to the air taxi</h2>
          <p className="option-time">Arrive {at(altTl.total)}</p>
          <p className="option-diff">{saved} minutes earlier than the late train, and {earlier} minutes earlier than planned.</p>
          <dl className="mini">
            <div>
              <dt>Extra cost</dt>
              <dd>Rs 2,700</dd>
              <small>Already includes Rs 1,200 back for your train ticket</small>
            </div>
            <div>
              <dt>Effort</dt>
              <dd>
                <EffortMeter level={alt.effort} />
              </dd>
              <small>{alt.effortNote}</small>
            </div>
          </dl>
        </section>

        <section className="card option" aria-labelledby="opt-b">
          <VehicleArt mode="train" />
          <h2 id="opt-b">Keep my train</h2>
          <p className="option-time">Arrive {at(origTl.total)}</p>
          <p className="option-diff">{orig.delay.minutes} minutes later than planned. No extra cost.</p>
        </section>

        <div className="sticky-choice">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              decide("switch");
            }}
          >
            Yes, switch for me
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => {
              decide("keep");
              router.push("/journey");
            }}
          >
            No, keep my train
          </button>
        </div>
        <p className="microcopy">You can change your mind until your train boards.</p>
      </main>
    </>
  );
}
