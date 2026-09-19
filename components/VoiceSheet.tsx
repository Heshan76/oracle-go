"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { DESTS, Dest, matchDest } from "@/lib/data";
import { Sheet } from "./Sheets";

/* Minimal typings for the Web Speech API (not in the default TS DOM lib). */
interface SRResultList {
  length: number;
  [i: number]: { 0: { transcript: string }; isFinal: boolean };
}
interface SRInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: SRResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SRCtor = new () => SRInstance;

function getSR(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

type State = "idle" | "listening" | "matched" | "nomatch" | "unsupported" | "blocked";

export default function VoiceSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (d: Dest) => void }) {
  const [state, setState] = useState<State>("idle");
  const [heard, setHeard] = useState("");
  const recRef = useRef<SRInstance | null>(null);

  const handleText = useCallback(
    (text: string) => {
      setHeard(text);
      const d = matchDest(text);
      if (d) {
        setState("matched");
        setTimeout(() => onPick(d), 900);
      } else {
        setState("nomatch");
      }
    },
    [onPick],
  );

  const listen = useCallback(() => {
    const SR = getSR();
    if (!SR) {
      setState("unsupported");
      return;
    }
    try {
      recRef.current?.abort();
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      let finalText = "";
      rec.onresult = (e) => {
        let t = "";
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        finalText = t;
        setHeard(t);
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") setState("blocked");
        else if (e.error !== "aborted") setState("nomatch");
      };
      rec.onend = () => {
        if (finalText) handleText(finalText);
        else setState((s) => (s === "listening" ? "nomatch" : s));
      };
      rec.start();
      recRef.current = rec;
      setHeard("");
      setState("listening");
    } catch {
      setState("unsupported");
    }
  }, [handleText]);

  useEffect(() => {
    if (open) {
      setHeard("");
      setState(getSR() ? "idle" : "unsupported");
      if (getSR()) listen();
    } else {
      recRef.current?.abort();
    }
    return () => recRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const message: Record<State, string> = {
    idle: "Tap the microphone and say where you want to go.",
    listening: "Listening. Say where you want to go.",
    matched: "Got it. Finding your routes.",
    nomatch: "I did not catch a place I know. Try again, or tap a phrase below.",
    unsupported: "Voice is not available on this browser. Tap a phrase below instead.",
    blocked: "The microphone is switched off. Tap a phrase below, or allow the microphone in your browser.",
  };

  return (
    <Sheet open={open} onClose={onClose} title="Say where to go">
      <div className="voice">
        <button type="button" className={`mic-big ${state === "listening" ? "mic-live" : ""}`} onClick={listen} aria-label={state === "listening" ? "Listening" : "Start listening"}>
          {state === "unsupported" || state === "blocked" ? <MicOff size={44} aria-hidden="true" /> : <Mic size={44} aria-hidden="true" />}
        </button>
        <p className="voice-status" role="status" aria-live="polite">
          {message[state]}
        </p>
        {heard ? <p className="voice-heard">I heard: &ldquo;{heard}&rdquo;</p> : null}
        <p className="help-label">Or tap a phrase</p>
        <div className="help-chips">
          {DESTS.map((d) => (
            <button key={d.id} type="button" className="chip chip-wide" onClick={() => handleText(`Take me to ${d.name}`)}>
              <Mic size={18} aria-hidden="true" />
              Take me to {d.name}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
