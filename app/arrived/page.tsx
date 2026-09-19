"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Frown, HeartHandshake, Leaf, Meh, Smile, Wallet } from "lucide-react";
import { TopBar } from "@/components/Nav";
import { EmptyState } from "@/components/ui";
import { money } from "@/lib/data";
import { useApp } from "@/lib/store";
import { at, duration } from "@/lib/trip";

const CAR_KG = 14;

export default function ArrivedPage() {
  const router = useRouter();
  const { ready, dest, route, routes, tl, phase, trip, resetTrip, notify } = useApp();
  const [rating, setRating] = useState<string | null>(null);

  if (!ready) {
    return (
      <>
        <TopBar title="Trip summary" back="/" />
        <main className="main">
          <div className="card skeleton" aria-busy="true" aria-label="Loading" />
        </main>
      </>
    );
  }

  if (!dest || !route || !tl || !phase) {
    return (
      <>
        <TopBar title="Trip summary" back="/" />
        <main className="main">
          <EmptyState title="No finished trip yet" body="When you complete a journey, your summary appears here." href="/" cta="Plan a journey" />
        </main>
      </>
    );
  }

  if (phase.kind !== "arrived") {
    return (
      <>
        <TopBar title="Trip summary" back="/journey" />
        <main className="main">
          <section className="card note-card">
            <h2>Your trip is not finished yet</h2>
            <p>You will see your summary here as soon as you arrive at {dest.name}.</p>
          </section>
          <Link href="/track" className="btn btn-primary btn-block">
            Open live map
          </Link>
        </main>
      </>
    );
  }

  const orig = routes.find((r) => r.id === trip.routeId);
  const plannedTotal = orig ? orig.legs[orig.legs.length - 1].start + orig.legs[orig.legs.length - 1].dur : tl.total;
  const diff = plannedTotal - tl.total;
  const saved = Math.max(0, CAR_KG - route.co2);

  return (
    <>
      <TopBar title="Trip summary" back="/journey" />
      <main className="main">
        <section className="card arrived-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/arrived.svg" alt="A calm lake at sunrise with green hills and a temple roof, with confetti in the sky" width={320} height={200} />
          <h2>You have arrived</h2>
          <p className="big-line">{dest.name}, at {at(tl.total)}</p>
          <p>{diff > 0 ? `That is ${diff} minutes earlier than first planned.` : diff < 0 ? `That is ${-diff} minutes later than first planned.` : "Right on time, as planned."}</p>
        </section>

        <dl className="stats">
          <div>
            <Clock size={24} aria-hidden="true" />
            <dt>Time on the move</dt>
            <dd>{duration(tl.total)}</dd>
          </div>
          <div>
            <Wallet size={24} aria-hidden="true" />
            <dt>You paid</dt>
            <dd>{money(route.price)}</dd>
          </div>
          <div>
            <Leaf size={24} aria-hidden="true" />
            <dt>Carbon saved</dt>
            <dd>{saved.toFixed(1)} kg</dd>
          </div>
        </dl>
        <p className="microcopy left">Driving alone would have produced about {CAR_KG} kg of carbon. Your trip produced {route.co2.toFixed(1)} kg.</p>

        <section className="card note-card">
          <p className="row-icon">
            <HeartHandshake size={24} aria-hidden="true" />
            <span>
              {trip.sharing ? (
                <>
                  <strong>Amma knows you arrived safely.</strong> We sent her a message.
                </>
              ) : (
                <>
                  <strong>Tell Amma you are here?</strong> One tap sends her a message.
                </>
              )}
            </span>
          </p>
          {!trip.sharing ? (
            <button type="button" className="btn btn-secondary btn-block" onClick={() => notify("Sent to Amma: \"I have arrived safely.\"", "ok")}>
              Send arrival message
            </button>
          ) : null}
        </section>

        <section className="card" aria-labelledby="rate-title">
          <h2 id="rate-title" className="card-title">
            How was your journey?
          </h2>
          <div className="rate" role="radiogroup" aria-labelledby="rate-title">
            {[
              { id: "easy", label: "Easy", icon: Smile },
              { id: "okay", label: "Okay", icon: Meh },
              { id: "hard", label: "Hard", icon: Frown },
            ].map((r) => {
              const I = r.icon;
              return (
                <button key={r.id} type="button" role="radio" aria-checked={rating === r.id} className={`rate-btn ${rating === r.id ? "rate-on" : ""}`} onClick={() => setRating(r.id)}>
                  <I size={30} aria-hidden="true" />
                  {r.label}
                </button>
              );
            })}
          </div>
          {rating ? (
            <p className="microcopy left" role="status">
              {rating === "hard" ? "Thank you. We are sorry it was hard. We will use this to make your next trip easier." : "Thank you. We use this to make every trip easier."}
            </p>
          ) : null}
        </section>

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            resetTrip();
            router.push("/");
          }}
        >
          Plan another journey
        </button>
      </main>
    </>
  );
}
