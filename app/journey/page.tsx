"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Accessibility, ArrowRight, Armchair, ChevronDown, Leaf, MapPin, ShieldCheck, Sparkles, Ticket, Timer, Users, Volume2 } from "lucide-react";
import { TopBar } from "@/components/Nav";
import { EmptyState, ModeBadge, StatusPill, VehicleArt } from "@/components/ui";
import { money } from "@/lib/data";
import { useApp } from "@/lib/store";
import { at, duration, minutesWord } from "@/lib/trip";

export default function JourneyPage() {
  const router = useRouter();
  const { ready, dest, route, tl, phase, status, said, coach, trip, startTrip, decide } = useApp();

  if (!ready) {
    return (
      <>
        <TopBar title="Your journey" back="/routes" />
        <main className="main">
          <div className="card skeleton" aria-busy="true" aria-label="Loading your journey" />
        </main>
      </>
    );
  }

  if (!dest || !route || !tl || !phase || !status || !said) {
    return (
      <>
        <TopBar title="Your journey" back="/" />
        <main className="main">
          <EmptyState title="No trip yet" body="Choose where you are going and pick a route. Your plan will appear here." href="/" cta="Plan a journey" />
        </main>
      </>
    );
  }

  const legs = tl.legs;
  const arrived = phase.kind === "arrived";
  const nowIdx = arrived ? legs.length - 1 : phase.i;
  const now = legs[nowIdx];
  const next = arrived ? null : legs[nowIdx + 1];
  const later = arrived ? [] : legs.slice(nowIdx + 2);

  const delayIdx = route.delay ? legs.findIndex((l) => l.id === route.delay!.legId) : -1;
  const beforeDelayedLeg = delayIdx >= 0 && !arrived && (phase.kind === "waiting" ? phase.i <= delayIdx : phase.i < delayIdx);
  const showHeadsUp = !!route.delay && !trip.rebooked && trip.decision === null && beforeDelayedLeg;
  const keptNote = !!route.delay && !trip.rebooked && trip.decision === "keep" && beforeDelayedLeg;

  const onStart = () => {
    startTrip();
    router.push("/track");
  };

  return (
    <>
      <TopBar title="Your journey" back="/routes" />
      <main className="main">
        {/* The three answers every screen gives */}
        <section className="card answers" aria-label="Journey summary">
          <div className="answers-top">
            <div>
              <p className="small-label">{arrived ? "You arrived at" : trip.started ? "You arrive at" : "You will arrive at"}</p>
              <p className="eta">{at(tl.total)}</p>
              <p className="eta-sub">
                {dest.name}, {duration(tl.total)} door to door
              </p>
              {tl.delay > 0 && !trip.rebooked ? <p className="eta-sub">Planned arrival was {at(tl.total - tl.delay)}</p> : null}
            </div>
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
          </div>
          <dl className="three">
            <div>
              <dt>
                <MapPin size={20} aria-hidden="true" />
                Where am I?
              </dt>
              <dd>{trip.started || arrived ? said.where : "At home, ready to start"}</dd>
            </div>
            <div>
              <dt>
                <ArrowRight size={20} aria-hidden="true" />
                What do I do next?
              </dt>
              <dd>{arrived ? "Nothing more to do." : trip.started ? said.action : now.title}</dd>
            </div>
            <div>
              <dt>
                <ShieldCheck size={20} aria-hidden="true" />
                Is everything okay?
              </dt>
              <dd>{status.detail}</dd>
            </div>
          </dl>
          {arrived ? (
            <Link href="/arrived" className="btn btn-primary btn-block">
              See my trip summary
            </Link>
          ) : trip.started ? (
            <Link href="/track" className="btn btn-primary btn-block">
              Open live map
            </Link>
          ) : (
            <button type="button" className="btn btn-primary btn-block" onClick={onStart}>
              Start my journey
            </button>
          )}
        </section>

        {/* Proactive AI: predicts the delay and offers a fix before the traveller notices */}
        {showHeadsUp ? (
          <section className="card alert-card" aria-labelledby="hu-title">
            <div className="alert-head">
              <span className="alert-icon" aria-hidden="true">
                <Sparkles size={24} />
              </span>
              <h2 id="hu-title">Heads-up: your train will probably be {route.delay!.minutes} minutes late</h2>
            </div>
            <p>{route.delay!.reason}</p>
            <p className="chance">
              <span className="chance-bar" aria-hidden="true">
                <i style={{ width: `${route.delay!.chance}%` }} />
              </span>
              I am {route.delay!.chance}% sure. I have found a faster option for you.
            </p>
            <p className="ask">Would you like to see it?</p>
            <div className="two-btns">
              <Link href="/rebook" className="btn btn-primary">
                Yes, show me
              </Link>
              <button type="button" className="btn btn-secondary" onClick={() => decide("keep")}>
                No, keep my plan
              </button>
            </div>
          </section>
        ) : null}

        {keptNote ? (
          <section className="card note-card">
            <p>
              <strong>You are keeping your train.</strong> We will keep watching and tell you straight away if anything changes.
            </p>
            <Link href="/rebook" className="btn btn-secondary btn-block">
              I changed my mind
            </Link>
          </section>
        ) : null}

        {trip.rebooked ? (
          <section className="card success-card">
            <p>
              <strong>You switched to the air taxi.</strong> Your tickets and boarding pass are updated. You now arrive at {at(tl.total)}.
            </p>
          </section>
        ) : null}

        {/* Now, Next, Later */}
        <section className="card now" aria-labelledby="now-title">
          <p className="badge-now">{arrived ? "Done" : "Now"}</p>
          <VehicleArt mode={now.mode} />
          <h2 id="now-title">{now.title}</h2>
          <p className="times">
            {at(now.s)} to {at(now.e)}, {duration(now.dur)}
          </p>
          {phase.kind === "waiting" ? <p className="leaves">Leaves in {minutesWord(phase.toStart)}</p> : null}
          {now.late > 0 ? (
            <StatusPill tone="warn">{now.late} minutes late</StatusPill>
          ) : null}
          {now.spot ? (
            <p className="spot">
              <MapPin size={20} aria-hidden="true" />
              {now.spot}
            </p>
          ) : null}
          <p className="note">{now.note}</p>
        </section>

        {next ? (
          <section className="card next" aria-labelledby="next-title">
            <p className="badge-next">Next</p>
            <div className="next-row">
              <ModeBadge mode={next.mode} size={48} />
              <div>
                <h2 id="next-title">{next.title}</h2>
                <p className="times">
                  Leaves {at(next.s)}, {duration(next.dur)}
                </p>
                {next.late > 0 ? <p className="late-note">{next.late} minutes later than planned</p> : null}
              </div>
            </div>
          </section>
        ) : null}

        {later.length > 0 ? (
          <details className="card later">
            <summary>
              <span>
                <strong>Later</strong>
                <small>{later.length === 1 ? "1 more step" : `${later.length} more steps`}</small>
              </span>
              <ChevronDown size={24} aria-hidden="true" />
            </summary>
            <ol className="later-list">
              {later.map((l) => (
                <li key={l.id}>
                  <ModeBadge mode={l.mode} size={40} />
                  <div>
                    <strong>{l.title}</strong>
                    <small>
                      {at(l.s)} to {at(l.e)}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        ) : null}

        {/* Transfer coach: the most stressful moment made calm */}
        {coach ? (
          <section className={`card coach coach-${coach.tone}`} aria-labelledby="coach-title">
            <h2 id="coach-title">
              <Timer size={22} aria-hidden="true" />
              Changing at {coach.place}
            </h2>
            <p className="coach-head">{coach.headline}</p>
            <div className="split" role="img" aria-label={`${coach.walk} minutes of walking and ${Math.max(0, coach.buffer - coach.walk)} minutes spare`}>
              <span className="split-walk" style={{ flexGrow: Math.max(coach.walk, 0.5) }}>
                Walk {coach.walk} min
              </span>
              <span className="split-spare" style={{ flexGrow: Math.max(coach.buffer - coach.walk, 0.5) }}>
                Spare {Math.max(0, coach.buffer - coach.walk)} min
              </span>
            </div>
            <p>{coach.detail}</p>
          </section>
        ) : null}

        {/* Comfort forecast */}
        <section aria-labelledby="cf-title" className="block">
          <h2 className="section-title" id="cf-title">
            What to expect on board
          </h2>
          <dl className="forecast">
            <div>
              <Users size={24} aria-hidden="true" />
              <dt>Crowds</dt>
              <dd>{route.comfort.crowd}</dd>
            </div>
            <div>
              <Volume2 size={24} aria-hidden="true" />
              <dt>Noise</dt>
              <dd>{route.comfort.noise}</dd>
            </div>
            <div>
              <Armchair size={24} aria-hidden="true" />
              <dt>Seat</dt>
              <dd>{route.comfort.seat}</dd>
            </div>
            <div>
              <Accessibility size={24} aria-hidden="true" />
              <dt>Access</dt>
              <dd>{route.comfort.access}</dd>
            </div>
          </dl>
        </section>

        <section className="card ticket" aria-label="Ticket and cost">
          <div className="ticket-row">
            <div>
              <p className="small-label">One ticket for every step</p>
              <p className="price">{money(route.price)}</p>
            </div>
            <p className="green">
              <Leaf size={20} aria-hidden="true" />
              {route.co2.toFixed(1)} kg CO₂
            </p>
          </div>
          <Link href="/boarding" className="btn btn-secondary btn-block">
            <Ticket size={22} aria-hidden="true" />
            Show my boarding pass
          </Link>
        </section>
      </main>
    </>
  );
}
