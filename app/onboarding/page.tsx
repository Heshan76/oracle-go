"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Vibrate, Volume2, Ear } from "lucide-react";
import { TopBar } from "@/components/Nav";
import { Prefer, Profile, useApp } from "@/lib/store";

function Choice({
  type = "radio",
  name,
  checked,
  onChange,
  title,
  desc,
}: {
  type?: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  desc?: string;
}) {
  return (
    <label className={`choice ${checked ? "choice-on" : ""}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} />
      <span className="choice-body">
        <strong>{title}</strong>
        {desc ? <small>{desc}</small> : null}
      </span>
      <span className="choice-tick" aria-hidden="true">
        <Check size={20} strokeWidth={3} />
      </span>
    </label>
  );
}

const STEPS = ["Reading", "Asking and alerts", "What matters"];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, setProfile, notify } = useApp();
  const [step, setStep] = useState(0);
  const head = useRef<HTMLHeadingElement>(null);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    head.current?.focus();
  }, [step]);

  const set = (p: Partial<Profile>) => setProfile(p);

  const finish = () => {
    setProfile({ done: true });
    notify("Your comfort settings are saved. You can change them any time on the Comfort tab.", "ok");
    router.push("/");
  };

  return (
    <>
      <TopBar title="Make it comfortable" back="/" />
      <main className="main">
        <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of 3`}>
          <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>
        <p className="progress-text">
          Step {step + 1} of 3: {STEPS[step]}
        </p>

        {step === 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="people" src="/images/people.svg" alt="Illustration of an older person, a wheelchair user, a parent with a child, a teenager and a traveller with a bag" width={360} height={190} />
            <h2 tabIndex={-1} ref={head} className="step-title">
              Is this easy to read?
            </h2>
            <p className="lead">Choose what feels best. The whole app changes as you choose.</p>

            <div className="preview" aria-live="polite">
              <p>Your bus is 3 stops away, arriving in 4 minutes.</p>
            </div>

            <fieldset className="group">
              <legend>Text size</legend>
              <Choice name="ts" checked={profile.textSize === "standard"} onChange={() => set({ textSize: "standard" })} title="Standard" desc="A good size for most people" />
              <Choice name="ts" checked={profile.textSize === "large"} onChange={() => set({ textSize: "large" })} title="Large" desc="Bigger words and buttons" />
              <Choice name="ts" checked={profile.textSize === "xlarge"} onChange={() => set({ textSize: "xlarge" })} title="Extra large" desc="The biggest words we have" />
            </fieldset>

            <fieldset className="group">
              <legend>Colours</legend>
              <Choice name="ct" checked={profile.contrast === "normal"} onChange={() => set({ contrast: "normal" })} title="Soft colours" desc="Calm blues and warm accents" />
              <Choice name="ct" checked={profile.contrast === "strong"} onChange={() => set({ contrast: "strong" })} title="Strong contrast" desc="Black and white with thick outlines" />
            </fieldset>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2 tabIndex={-1} ref={head} className="step-title">
              How do you like to ask?
            </h2>
            <p className="lead">You can always do it another way. Nothing is taken away.</p>

            <fieldset className="group">
              <legend>Starting a journey</legend>
              <Choice name="in" checked={profile.input === "either"} onChange={() => set({ input: "either" })} title="Type or speak" desc="Both are always on screen" />
              <Choice name="in" checked={profile.input === "voice"} onChange={() => set({ input: "voice" })} title="Speak first" desc="The microphone comes first" />
              <Choice name="in" checked={profile.input === "tap"} onChange={() => set({ input: "tap" })} title="Type and tap only" desc="No microphone button" />
            </fieldset>

            <fieldset className="group">
              <legend>While travelling, show me</legend>
              <Choice name="vw" checked={profile.view === "map"} onChange={() => set({ view: "map" })} title="The map" desc="With words written above it" />
              <Choice name="vw" checked={profile.view === "text"} onChange={() => set({ view: "text" })} title="Text steps" desc="A simple list, no map needed" />
            </fieldset>

            <fieldset className="group">
              <legend>How should we alert you?</legend>
              <p className="group-note">Words on screen are always on. Add any of these:</p>
              <Choice type="checkbox" name="al1" checked={profile.vibrate} onChange={() => set({ vibrate: !profile.vibrate })} title="Vibrate" desc="A short buzz on your phone" />
              <Choice type="checkbox" name="al2" checked={profile.sound} onChange={() => set({ sound: !profile.sound })} title="Play a sound" desc="A soft beep" />
              <Choice type="checkbox" name="al3" checked={profile.readAloud} onChange={() => set({ readAloud: !profile.readAloud })} title="Read aloud" desc="We speak each alert" />
              <button type="button" className="btn btn-secondary btn-block" onClick={() => notify("Your bus is 3 stops away, arriving in 4 minutes.", "info")}>
                {profile.readAloud ? <Ear size={22} aria-hidden="true" /> : profile.sound ? <Volume2 size={22} aria-hidden="true" /> : <Vibrate size={22} aria-hidden="true" />}
                Try an alert
              </button>
            </fieldset>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 tabIndex={-1} ref={head} className="step-title">
              What matters most on a trip?
            </h2>
            <p className="lead">We will show this kind of route first. You can still see the others.</p>

            <fieldset className="group">
              <legend>My top pick</legend>
              {(
                [
                  ["easiest", "Easiest", "Fewest changes, step-free, a seat"],
                  ["fastest", "Fastest", "Get there soonest"],
                  ["cheapest", "Cheapest", "Spend the least"],
                  ["greenest", "Greenest", "Lowest carbon"],
                ] as [Prefer, string, string][]
              ).map(([id, t, d]) => (
                <Choice key={id} name="pf" checked={profile.prefer === id} onChange={() => set({ prefer: id })} title={t} desc={d} />
              ))}
            </fieldset>

            <fieldset className="group">
              <legend>Buttons</legend>
              <Choice type="checkbox" name="bb" checked={profile.bigButtons} onChange={() => set({ bigButtons: !profile.bigButtons })} title="Make buttons bigger" desc="Easier to tap, with more space" />
              <p className="group-note">Oracle Go also notices if you often miss a button, and will offer this for you.</p>
            </fieldset>
          </>
        ) : null}

        <div className="wizard-nav">
          {step > 0 ? (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={finish}>
              Save and start
            </button>
          )}
        </div>
      </main>
    </>
  );
}
