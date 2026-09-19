import Link from "next/link";
import { Bus, CarFront, CircleCheck, Footprints, Info, Plane, TrainFront, TriangleAlert } from "lucide-react";
import { MODE_ALT, MODE_IMAGE, MODE_LABEL, Mode } from "@/lib/data";

const ICONS = { walk: Footprints, bus: Bus, train: TrainFront, air: Plane, road: CarFront } as const;

export function ModeIcon({ mode, size = 22 }: { mode: Mode; size?: number }) {
  const I = ICONS[mode];
  return <I size={size} strokeWidth={2.2} aria-hidden="true" />;
}

/** Coloured square with a mode icon. Colour never carries meaning alone: the label is always nearby. */
export function ModeBadge({ mode, size = 44 }: { mode: Mode; size?: number }) {
  return (
    <span className={`mb mb-${mode}`} style={{ width: size, height: size }} aria-hidden="true">
      <ModeIcon mode={mode} size={Math.round(size * 0.5)} />
    </span>
  );
}

/** Real illustration of the vehicle, with a walking fallback. */
export function VehicleArt({ mode, className = "" }: { mode: Mode; className?: string }) {
  const src = MODE_IMAGE[mode];
  if (!src) {
    return (
      <div className={`walk-art ${className}`} role="img" aria-label={MODE_ALT[mode]}>
        <Footprints size={56} strokeWidth={1.8} aria-hidden="true" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`vehicle-art ${className}`} src={src} alt={MODE_ALT[mode]} width={320} height={170} loading="lazy" />;
}

export function StatusPill({ tone, children }: { tone: "ok" | "warn" | "info"; children: React.ReactNode }) {
  const Icon = tone === "ok" ? CircleCheck : tone === "warn" ? TriangleAlert : Info;
  return (
    <span className={`pill pill-${tone}`}>
      <Icon size={18} strokeWidth={2.4} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

const EFFORT = ["", "Easy", "Moderate", "Tiring"];
export function EffortMeter({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="effort" role="img" aria-label={`Effort: ${EFFORT[level]}`}>
      <span className="effort-bars" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <i key={n} className={n <= level ? "on" : ""} style={{ height: 8 + n * 5 }} />
        ))}
      </span>
      <span className="effort-word">{EFFORT[level]}</span>
    </span>
  );
}

export function EmptyState({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="card empty">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/people.svg" alt="" width={360} height={190} className="empty-art" />
      <h2>{title}</h2>
      <p>{body}</p>
      <Link href={href} className="btn btn-primary btn-block">
        {cta}
      </Link>
    </div>
  );
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5EF0DC" />
          <stop offset="1" stopColor="#FFB020" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="17" fill="none" stroke="url(#lg)" strokeWidth="4" />
      <circle cx="20" cy="20" r="6" fill="#fff" />
      <circle cx="31.5" cy="11" r="3.2" fill="#FFB020" />
    </svg>
  );
}
