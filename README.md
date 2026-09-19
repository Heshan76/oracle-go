# Oracle Go

One calm app for every way to travel in 2100. Built for Cre8x 3.0, Round 01: The Oracle Challenge.

Autonomous buses, maglev trains, air taxis and smart-road pods, planned and tracked in a single flow that works for everyone: older people, disabled people and people who are less confident with technology.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Production check:

```bash
npm run build
npm start
```

## Deploy free on Vercel

1. Push this folder to a GitHub repository.
2. Go to vercel.com, choose "Add New Project", import the repository.
3. Click Deploy. You get a public link in about two minutes.
4. Open the link in a private window on your phone to confirm it is public.

GitHub Pages also works: uncomment `output: "export"` and `basePath` in `next.config.mjs`.

## The three required screens

| Screen | Route |
|---|---|
| Home | `/` |
| Journey / Route Details | `/journey` |
| Live Map / Tracking | `/track` |

Extra screens: `/routes` (route options), `/rebook` (smart rebooking), `/boarding` (boarding pass), `/arrived` (trip summary), `/onboarding` (comfort setup).

## Quick demo path for judges

1. Home: tap "Temple of the Tooth" (or type or speak it).
2. Routes: tap "See this route" on the top pick.
3. Journey: read the "Heads-up" card, tap "Yes, show me", then "Yes, switch for me".
4. Journey: tap "Start my journey".
5. Live map: switch between Map and Text steps. Open "Demo controls" and use "Skip 10 minutes" to move through the trip.

## Inclusive design decisions

- Three answers on every trip screen: Where am I? What do I do next? Is everything okay?
- Three ways to start a journey: type, speak, or tap a place.
- Every map has a plain-language text twin and a Text steps view.
- Comfort setup (text size, contrast, input style, alerts, route preference) changes the whole app live. It is a profile for everyone, not a disability mode.
- Alerts use text and icon always, plus vibration, sound or read-aloud if chosen.
- Colour is never the only signal: markers differ by shape, lines by pattern, statuses always have words.
- Help is in the same place on every screen.
- Large touch targets. The app offers bigger buttons if it notices repeated near-miss taps.
- Fonts: Lexend and Atkinson Hyperlegible, both designed for readability.

## Images

All illustrations are in `public/images` as SVG files. Replace any of them with photos by keeping the same file names.

## Stack

Next.js 15 (App Router), React 19, TypeScript, plain CSS, lucide-react icons. No backend. State is kept in the browser.
