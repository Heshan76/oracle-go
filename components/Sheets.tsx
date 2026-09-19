"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CircleCheck, MapPin, MessageCircle, Phone, ShieldAlert, TriangleAlert, X } from "lucide-react";
import { useApp } from "@/lib/store";

/* ---------- generic bottom sheet ---------- */
export function Sheet({ open, onClose, title, children, tone }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; tone?: "plain" }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-wrap" data-ok-tap>
      <button type="button" className="sheet-backdrop" aria-label="Close" onClick={onClose} tabIndex={-1} />
      <div className={`sheet ${tone === "plain" ? "" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button ref={closeRef} type="button" className="btn btn-quiet btn-small" onClick={onClose}>
            <X size={20} aria-hidden="true" />
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Help: always one tap away ---------- */
export function HelpSheet() {
  const { helpOpen, setHelpOpen, said, route, notify } = useApp();
  const [answer, setAnswer] = useState<string | null>(null);
  const [share, setShare] = useState(true);

  useEffect(() => {
    if (!helpOpen) setAnswer(null);
  }, [helpOpen]);

  const noTrip = "You have not picked a trip yet. Choose a place on the Plan tab and I will guide you.";
  const questions: { q: string; a: string }[] = [
    { q: "Where is my next vehicle?", a: said ? said.headline : noTrip },
    { q: "Where am I now?", a: said ? `${said.where}. ${said.next}` : noTrip },
    { q: "I need a lift or a ramp", a: route ? `${route.comfort.access}. Staff can meet you at the platform if you tap "Talk to a person".` : "Every stop in Oracle Go has a lift or ramp. Staff can meet you if you ask." },
    { q: "I missed my connection", a: "No problem. Your ticket stays valid. I will find the next vehicle and tell you the new time. You will not pay extra." },
  ];

  return (
    <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="How can we help?">
      <div className="help-grid">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            setHelpOpen(false);
            notify("Connecting you to a person. This is a demo, so no call is made.", "info");
          }}
        >
          <Phone size={22} aria-hidden="true" />
          Talk to a person
        </button>

        <p className="help-label">Or ask the assistant</p>
        <div className="help-chips">
          {questions.map((x) => (
            <button key={x.q} type="button" className="chip chip-wide" onClick={() => setAnswer(x.a)}>
              <MessageCircle size={18} aria-hidden="true" />
              {x.q}
            </button>
          ))}
        </div>
        {answer ? (
          <div className="bubble" role="status" aria-live="polite">
            {answer}
          </div>
        ) : null}

        <label className="switch-row">
          <span className="switch-text">
            <MapPin size={20} aria-hidden="true" />
            <span>
              <strong>Share my location with support</strong>
              <small>{share ? "On. Helpers can find you quickly." : "Off. Helpers cannot see where you are."}</small>
            </span>
          </span>
          <input type="checkbox" role="switch" checked={share} onChange={(e) => setShare(e.target.checked)} className="switch" />
        </label>

        <button
          type="button"
          className="btn btn-danger btn-block"
          onClick={() => {
            setHelpOpen(false);
            notify("Emergency services would be called now. This is a demo.", "warn");
          }}
        >
          <ShieldAlert size={22} aria-hidden="true" />
          Emergency: call for help
        </button>
      </div>
    </Sheet>
  );
}

/* ---------- Adaptive offer: bigger buttons after repeated near-miss taps ---------- */
export function BigOffer() {
  const { bigOffer, answerBigOffer } = useApp();
  if (!bigOffer) return null;
  return (
    <div className="offer" role="dialog" aria-label="Make buttons bigger?" data-ok-tap>
      <p>
        <strong>Are the buttons hard to hit?</strong> We can make every button bigger for you.
      </p>
      <div className="offer-actions">
        <button type="button" className="btn btn-primary" onClick={() => answerBigOffer(true)}>
          Yes, make them bigger
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => answerBigOffer(false)}>
          No, keep them
        </button>
      </div>
    </div>
  );
}

/* ---------- Alerts: always text and icon, plus vibration, sound or voice if chosen ---------- */
export function Toaster() {
  const { toast, clearToast } = useApp();
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(clearToast, 11000);
    return () => clearTimeout(id);
  }, [toast, clearToast]);
  if (!toast) return null;
  const Icon = toast.tone === "ok" ? CircleCheck : toast.tone === "warn" ? TriangleAlert : Bell;
  return (
    <div className={`toast toast-${toast.tone}`} role="status" aria-live="polite" key={toast.id} data-ok-tap>
      <Icon size={26} strokeWidth={2.3} aria-hidden="true" className="toast-icon" />
      <p>{toast.msg}</p>
      <button type="button" className="toast-close" onClick={clearToast}>
        OK
      </button>
    </div>
  );
}
