"use client";

import { Bus, CarFront, Flag, Footprints, Plane, TrainFront, TriangleAlert, User } from "lucide-react";
import { Mode } from "@/lib/data";
import { P2, Phase, Timeline, aboard, pointAlong, ptsToStr, slicePath } from "@/lib/trip";

/* The map is schematic on purpose: no tiles, no keys, always loads, and every mark is
   labelled in words. Shapes and line patterns carry meaning, not just colour. */

const proj = (p: P2): P2 => [p[0], (p[1] - 40) * 0.76 + 30];
const projAll = (pts: P2[]): P2[] => pts.map(proj);

const ICON = { walk: Footprints, bus: Bus, train: TrainFront, air: Plane, road: CarFront } as const;

const LINE: Record<Mode, { width: number; dash?: string; cap: "round" | "butt" }> = {
  walk: { width: 4, dash: "1 8", cap: "round" },
  bus: { width: 7, cap: "round" },
  train: { width: 8, cap: "butt" },
  road: { width: 6, dash: "12 7", cap: "butt" },
  air: { width: 4, dash: "1 9", cap: "round" },
};

function shortName(n: string) {
  return n
    .replace("Home, Dehiwala", "Home")
    .replace("Dehiwala Bus Bay 2", "Bus Bay 2")
    .replace("Colombo ", "")
    .replace(" Central Station", " Station")
    .replace("Temple of the Tooth", "Temple");
}

function fracOf(j: number, phase: Phase) {
  if (phase.kind === "arrived") return 1;
  if (phase.kind === "riding") return j < phase.i ? 1 : j === phase.i ? phase.frac : 0;
  return j < phase.i ? 1 : 0;
}

function Pill({ x, y, text, scale, tone = "ink" }: { x: number; y: number; text: string; scale: number; tone?: "ink" | "sun" }) {
  const fs = 12 * scale;
  const w = text.length * 6.7 * scale + 18;
  const cx = Math.max(w / 2 + 4, Math.min(360 - w / 2 - 4, x));
  return (
    <g>
      <rect x={cx - w / 2} y={y - fs - 4} width={w} height={fs + 10} rx={(fs + 10) / 2} className={tone === "sun" ? "map-pill-sun" : "map-pill"} />
      <text x={cx} y={y - 1} textAnchor="middle" fontSize={fs} fontWeight={700} className={tone === "sun" ? "map-pill-sun-text" : "map-pill-text"}>
        {text}
      </text>
    </g>
  );
}

export default function TransitMap({
  tl,
  phase,
  started,
  labelScale = 1,
  destName,
  riskLabel,
}: {
  tl: Timeline;
  phase: Phase;
  started: boolean;
  labelScale?: number;
  destName: string;
  riskLabel?: string | null;
}) {
  const legs = tl.legs;
  const scale = labelScale;

  /* stop labels */
  const nodes: { name: string; pos: P2; last: boolean }[] = [];
  const pushNode = (name: string, pos: P2, last = false) => {
    if (!nodes.some((n) => n.name === name)) nodes.push({ name, pos, last });
  };
  pushNode(legs[0].from, proj(legs[0].path[0]));
  legs.forEach((l, i) => pushNode(l.to, proj(l.path[l.path.length - 1]), i === legs.length - 1));

  /* where is the traveller? */
  let youPos: P2;
  let youMode: Mode | null = null;
  let youLabel = "You";
  let incoming: { pos: P2; mode: Mode; label: string } | null = null;

  if (phase.kind === "riding") {
    const L = legs[phase.i];
    youPos = pointAlong(projAll(L.path), phase.frac);
    youMode = L.mode;
    youLabel = L.mode === "walk" ? "You" : `You are ${aboard(L)}`;
  } else if (phase.kind === "waiting") {
    const from = phase.from >= 0 ? legs[phase.from] : null;
    youPos = from ? proj(from.path[from.path.length - 1]) : proj(legs[0].path[0]);
    const N = legs[phase.i];
    if (N.mode !== "walk") {
      const p0 = proj(N.path[0]);
      const p1 = proj(N.path[1] ?? N.path[0]);
      let dx = p0[0] - p1[0];
      let dy = p0[1] - p1[1];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const dist = Math.min(phase.toStart, 14) * 5.5 + 48;
      incoming = { pos: [p0[0] + dx * dist, p0[1] + dy * dist], mode: N.mode, label: `Your ${N.mode === "road" ? "pod" : N.mode === "air" ? "air taxi" : N.mode}` };
    }
  } else {
    youPos = proj(legs[legs.length - 1].path[legs[legs.length - 1].path.length - 1]);
  }

  const YouIcon = youMode ? ICON[youMode] : User;
  const YouColor = youMode ? `var(--mode-${youMode})` : "var(--ink)";
  const hasRisk = riskLabel && legs.some((l) => l.mode === "train");
  const trainLeg = legs.find((l) => l.mode === "train");
  const riskPos = trainLeg ? pointAlong(projAll(trainLeg.path), 0.5) : null;
  const fs = 12 * scale;

  return (
    <svg viewBox="0 0 360 410" className="map" role="img" aria-label="Map of your journey. The text above the map describes the same information in words.">
      {/* land, sea, hills */}
      <rect width="360" height="410" fill="var(--map-land)" />
      <path d="M0 175C22 205 38 230 40 262S32 322 42 356S36 392 30 410H0Z" fill="var(--map-sea)" />
      <path d="M0 175C22 205 38 230 40 262S32 322 42 356S36 392 30 410" fill="none" stroke="var(--map-shore)" strokeWidth="3" />
      <ellipse cx="275" cy="62" rx="92" ry="58" fill="var(--map-hill)" />
      <ellipse cx="275" cy="62" rx="62" ry="38" fill="none" stroke="var(--map-shore)" strokeWidth="1.5" />
      <ellipse cx="275" cy="62" rx="32" ry="18" fill="none" stroke="var(--map-shore)" strokeWidth="1.5" />
      <ellipse cx="313" cy="46" rx="15" ry="8" fill="var(--map-sea)" />
      <g stroke="var(--map-road)" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M0 250L120 250L200 210L360 210" />
        <path d="M150 410L170 330L235 280L360 262" />
        <path d="M200 0L206 90L190 160L215 210" />
        <path d="M70 330L180 345L300 330L360 340" />
      </g>

      {/* legs: casing, faded full line, then bright travelled part */}
      {legs.map((l, j) => {
        const pts = projAll(l.path);
        const st = LINE[l.mode];
        const f = fracOf(j, phase);
        return (
          <g key={l.id}>
            <polyline points={ptsToStr(pts)} fill="none" stroke="var(--map-casing)" strokeWidth={st.width + 5} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={ptsToStr(pts)} fill="none" stroke={`var(--mode-${l.mode})`} strokeOpacity={0.4} strokeWidth={st.width} strokeDasharray={st.dash} strokeLinecap={st.cap} strokeLinejoin="round" />
            {l.mode === "train" ? <polyline points={ptsToStr(pts)} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={2} strokeDasharray="2 9" /> : null}
            {f > 0.001 ? (
              <polyline points={ptsToStr(slicePath(pts, f))} fill="none" stroke={`var(--mode-${l.mode})`} strokeWidth={st.width} strokeDasharray={st.dash} strokeLinecap={st.cap} strokeLinejoin="round" />
            ) : null}
          </g>
        );
      })}

      {/* stops with words */}
      {nodes.map((n) => {
        const right = n.pos[0] < 190;
        let dx = right ? 13 : -13;
        let dy = 5;
        if (n.name.includes("Sky Port") && right) {
          dx = 12;
          dy = -10;
        }
        if (n.name === "Colombo Fort Station" || n.name === "Colombo Fort Bus Hub") dy = 20;
        const label = shortName(n.name);
        return (
          <g key={n.name}>
            {n.last ? (
              <>
                <circle cx={n.pos[0]} cy={n.pos[1]} r={11} fill="var(--ink)" stroke="#fff" strokeWidth={3} />
                <Flag x={n.pos[0] - 6} y={n.pos[1] - 6} size={12} color="#fff" strokeWidth={2.6} />
              </>
            ) : (
              <circle cx={n.pos[0]} cy={n.pos[1]} r={7} fill="#fff" stroke="var(--ink)" strokeWidth={3} />
            )}
            <text x={n.pos[0] + dx} y={n.pos[1] + dy} textAnchor={right ? "start" : "end"} fontSize={fs} fontWeight={n.last ? 800 : 700} className="map-label">
              {n.last ? destName : label}
            </text>
          </g>
        );
      })}

      {/* disruption warning */}
      {hasRisk && riskPos ? (
        <g>
          <circle cx={riskPos[0]} cy={riskPos[1]} r={13} fill="var(--sun)" stroke="var(--ink)" strokeWidth={2.5} />
          <TriangleAlert x={riskPos[0] - 8} y={riskPos[1] - 9} size={16} color="var(--ink)" strokeWidth={2.6} />
          <text x={riskPos[0] + 18} y={riskPos[1] + 5} fontSize={fs} fontWeight={800} className="map-label">
            {riskLabel}
          </text>
        </g>
      ) : null}

      {/* incoming vehicle: dashed outline says "on its way" */}
      {incoming ? (
        <g>
          <rect x={incoming.pos[0] - 15} y={incoming.pos[1] - 15} width={30} height={30} rx={9} fill="#fff" stroke={`var(--mode-${incoming.mode})`} strokeWidth={3} strokeDasharray="5 3" />
          {(() => {
            const I = ICON[incoming.mode];
            return <I x={incoming.pos[0] - 9} y={incoming.pos[1] - 9} size={18} color={`var(--mode-${incoming.mode})`} strokeWidth={2.4} />;
          })()}
          <Pill x={incoming.pos[0]} y={incoming.pos[1] + 41} text={incoming.label} scale={scale} />
        </g>
      ) : null}

      {/* you: circle = a person on foot or waiting, rounded square = riding a vehicle */}
      <g>
        {started || phase.kind !== "riding" || phase.frac > 0 ? <circle cx={youPos[0]} cy={youPos[1]} r={16} className="map-pulse" fill={YouColor} /> : null}
        {youMode && youMode !== "walk" ? (
          <rect x={youPos[0] - 17} y={youPos[1] - 17} width={34} height={34} rx={10} fill={YouColor} stroke="#fff" strokeWidth={3.5} />
        ) : (
          <circle cx={youPos[0]} cy={youPos[1]} r={17} fill={YouColor} stroke="#fff" strokeWidth={3.5} />
        )}
        <YouIcon x={youPos[0] - 10} y={youPos[1] - 10} size={20} color="#fff" strokeWidth={2.4} />
        {phase.kind !== "arrived" ? <Pill x={youPos[0]} y={youPos[1] + (youPos[1] < 120 ? 44 : -24)} text={youLabel} scale={scale} tone="sun" /> : null}
      </g>

      {/* compass */}
      <g transform="translate(332 388)">
        <circle r="15" fill="#fff" stroke="var(--ink)" strokeWidth="2" />
        <path d="M0 -10L5 4L0 1L-5 4Z" fill="var(--ink)" />
        <text y="-19" textAnchor="middle" fontSize="10" fontWeight="800" className="map-label" style={{ strokeWidth: 3 }}>
          N
        </text>
      </g>
    </svg>
  );
}
