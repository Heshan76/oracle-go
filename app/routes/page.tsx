"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Armchair, Leaf, Repeat, Sparkles, Users, Wallet, Zap } from "lucide-react";
import { TopBar } from "@/components/Nav";
import { EffortMeter, EmptyState, ModeBadge } from "@/components/ui";
import { HOME_NAME, MODE_LABEL, RouteDef, money } from "@/lib/data";
import { Prefer, useApp } from "@/lib/store";
import { at, duration } from "@/lib/trip";

const PREFS: { id: Prefer; label: string; icon: typeof Zap }[] = [
  { id: "easiest", label: "Easiest", icon: Armchair },
  { id: "fastest", label: "Fastest", icon: Zap },
  { id: "cheapest", label: "Cheapest", icon: Wallet },
  { id: "greenest", label: "Greenest", icon: Leaf },
];

const planned = (r: RouteDef) => r.legs[r.legs.length - 1].start + r.legs[r.legs.length - 1].dur;

function sortRoutes(routes: RouteDef[], p: Prefer) {
  const copy = [...routes];
  copy.sort((a, b) => {
    if (p === "fastest") return planned(a) - planned(b);
    if (p === "cheapest") return a.price - b.price;
    if (p === "greenest") return a.co2 - b.co2;
    return a.effort - b.effort || planned(a) - planned(b);
  });
  return copy;
}

const TOP_REASON: Record<Prefer, string> = {
  easiest: "Least effort: step-free, seats likely and time to change.",
  fastest: "Gets you there soonest.",
  cheapest: "Costs the least.",
  greenest: "Produces the least carbon.",
};

export default function RoutesPage() {
  const router = useRouter();
  const { dest, routes, chooseRoute, profile, ready } = useApp();
  const [prefer, setPrefer] = useState<Prefer>("easiest");

  useEffect(() => {
    if (ready) setPrefer(profile.prefer);
  }, [ready, profile.prefer]);

  const sorted = useMemo(() => sortRoutes(routes, prefer), [routes, prefer]);

  if (!dest) {
    return (
      <>
        <TopBar title="Choose your route" back="/" />
        <main className="main">
          <EmptyState title="Where would you like to go?" body="Pick a place first and we will show every way to get there." href="/" cta="Choose a place" />
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Choose your route" back="/" />
      <main className="main">
        <section className="card summary" aria-label="Your trip">
          <div className="summary-line">
            <span className="dot dot-from" aria-hidden="true" />
            <div>
              <span className="small-label">From</span>
              <strong>{HOME_NAME}</strong>
            </div>
          </div>
          <div className="summary-line">
            <span className="dot dot-to" aria-hidden="true" />
            <div>
              <span className="small-label">To</span>
              <strong>{dest.name}</strong>
            </div>
          </div>
          <p className="summary-foot">
            Leaving now, {at(0)}.{" "}
            <Link href="/" className="inline-link">
              Change place
            </Link>
          </p>
        </section>

        <div className="block">
          <h2 className="section-title" id="pref-title">
            What matters most?
          </h2>
          <div className="chips" role="radiogroup" aria-labelledby="pref-title">
            {PREFS.map((p) => {
              const I = p.icon;
              const on = prefer === p.id;
              return (
                <button key={p.id} type="button" role="radio" aria-checked={on} className={`chip chip-choice ${on ? "chip-on" : ""}`} onClick={() => setPrefer(p.id)}>
                  <I size={20} aria-hidden="true" />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="block" aria-live="polite">
          <h2 className="section-title">{sorted.length} ways to get there</h2>
          <div className="stack-lg">
            {sorted.map((r, i) => {
              const total = planned(r);
              const top = i === 0;
              return (
                <article key={r.id} className={`card route ${top ? "route-top" : ""}`} aria-labelledby={`r-${r.id}`}>
                  {top ? (
                    <p className="ribbon">
                      <Sparkles size={18} aria-hidden="true" />
                      Top pick for {PREFS.find((p) => p.id === prefer)!.label.toLowerCase()}
                    </p>
                  ) : null}
                  <h3 id={`r-${r.id}`}>{r.name}</h3>
                  <p className="route-why">{top ? TOP_REASON[prefer] : r.why}</p>

                  <dl className="route-times">
                    <div>
                      <dt>Arrive</dt>
                      <dd className="big">{at(total)}</dd>
                    </div>
                    <div>
                      <dt>Total time</dt>
                      <dd>{duration(total)}</dd>
                    </div>
                    <div>
                      <dt>Price</dt>
                      <dd>{money(r.price)}</dd>
                    </div>
                  </dl>

                  <ol className="chain" aria-label={`Steps: ${r.legs.map((l) => `${MODE_LABEL[l.mode]} ${l.dur} minutes`).join(", then ")}`}>
                    {r.legs.map((l) => (
                      <li key={l.id}>
                        <ModeBadge mode={l.mode} size={40} />
                        <span>{MODE_LABEL[l.mode]}</span>
                        <small>{l.dur} min</small>
                      </li>
                    ))}
                  </ol>

                  <ul className="facts">
                    <li>
                      <EffortMeter level={r.effort} />
                      <small>{r.effortNote}</small>
                    </li>
                    <li>
                      <span className="fact-line">
                        <Repeat size={20} aria-hidden="true" />
                        <strong>{r.changes} changes</strong>
                      </span>
                      <small>Tickets are joined into one</small>
                    </li>
                    <li>
                      <span className="fact-line">
                        <Users size={20} aria-hidden="true" />
                        <strong>{r.comfort.crowd}</strong>
                      </span>
                      <small>{r.comfort.seat}</small>
                    </li>
                    <li>
                      <span className="fact-line">
                        <Leaf size={20} aria-hidden="true" />
                        <strong>{r.co2.toFixed(1)} kg CO₂</strong>
                      </span>
                      <small>{r.co2 <= 1.2 ? "Very low carbon" : r.co2 <= 3 ? "Low carbon" : "Higher carbon"}</small>
                    </li>
                  </ul>

                  <button
                    type="button"
                    className={`btn btn-block ${top ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => {
                      chooseRoute(r.id);
                      router.push("/journey");
                    }}
                  >
                    See this route
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
