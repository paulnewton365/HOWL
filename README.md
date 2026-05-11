# HOWL READ

**A brand diagnostic.** From HOWL, by Antenna Group.

The READ scores any brand across six signals — VOLUME, INTEGRATION, IDENTITY, CANDOR, DESIRE, MOMENTUM — evaluated across four evidence surfaces (Website, Social, Reputation, Earned). It returns a verdict (Whispering / Speaking / Howling) and recommendations split into **EDGE** (strategy) and **PLAY** (creative provocations).

The thesis is HOWL's: brands have been shouting at the same volume, frequency, and time as everyone else. The READ is the diagnostic that tells a brand exactly where the whisper is, and what to do about it.

---

## What it does

1. The user submits a brand name, website URL, category, business model, and optional context (social handles, AI engine summary, additional notes).
2. Claude (with web_search) reads the brand across four evidence surfaces — homepage and owned pages, social feeds, third-party reputation surfaces (AI engines, reviews, Glassdoor, Reddit, certifications), and earned media from the last 12 months.
3. Each of the six signals gets a score on each of the four surfaces. Signal scores are the mean of the four surface scores. Overall = mean of signal scores.
4. The report renders a radial stacked-bar chart, per-signal cards with surface breakdowns and evidence, and brand-specific EDGE and PLAY recommendations.

Last READ is cached in `localStorage` so the user can come back to it without re-running.

---

## The six signals

| Signal | Question |
|--------|----------|
| **VOLUME** | Are you cutting through, or whispering at the same frequency as everyone else? |
| **INTEGRATION** | Is what makes you distinctive woven into the brand, or quarantined into corporate corners? |
| **IDENTITY** | Is your distinctiveness embodied in who you are, or communicated as a side note? |
| **CANDOR** | Are you showing scars as well as vision, or only the polished aspiration? |
| **DESIRE** | Are you inviting people into a future they want, or instructing them to comply? |
| **MOMENTUM** | Are you earning cultural attention, or fading quietly into the feed? |

## The four evidence surfaces

| Surface | Covers | Colour |
|---------|--------|--------|
| **WEBSITE** | Homepage, About, product pages, blog | Coral-deep `#D85726` |
| **SOCIAL** | LinkedIn, Instagram, X, TikTok, YouTube | Coral `#F47245` |
| **REPUTATION** | AI engine descriptions, Trustpilot, Glassdoor, Reddit, certifications, trust marks | Sand `#C29469` |
| **EARNED** | Press coverage, podcasts, awards, third-party conversation | Ink `#0A0A0A` |

Verdict tiers: **0–39 Whispering · 40–69 Speaking · 70–100 Howling.**

Full framework lives in `src/data/rubric.js`.

---

## Replacing the brand assets

The repo ships with placeholder assets so the layout doesn't break. Replace these with the real files at any time — **no code changes needed**, just drop the file in `public/`:

| Placeholder file | Replace with |
|------------------|---------------|
| `public/howl-logo.svg` | Your official HOWL logo (SVG preferred for sharpness; keep filename) |
| `public/howl-hero.jpg` | The face-and-orange-flowers photo from the deck (any size, JPG/PNG) |

The hero image has a graceful fallback: if `howl-hero.jpg` is missing, the app renders `howl-hero.svg` (a black canvas with the orange-flower motif) so the layout always works.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7 |
| Styling | Tailwind CSS 4 + hand-written HOWL design tokens in `src/index.css` |
| Icons | Lucide React |
| Charts | Custom SVG radial stacked-bar — no chart library |
| AI | Anthropic Claude (`claude-sonnet-4-6`) with `web_search` tool |
| Backend | Vercel serverless function (`api/claude.js`) |
| Hosting | Vercel |

No database. No auth. Last result lives in `localStorage` only.

---

## Local development

```bash
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm run dev
```

`vite dev` does not run the `/api/claude` serverless function. For local end-to-end testing with the AI call:

```bash
npm i -g vercel
vercel dev
```

---

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Add one environment variable: `ANTHROPIC_API_KEY` (Production, Preview, Development).
4. Deploy.

The API key is server-side only. The client posts to `/api/claude`, which proxies to Anthropic with the key attached.

---

## Project structure

```
howl-read/
├── api/
│   └── claude.js              # Anthropic proxy (Vercel serverless)
├── public/
│   ├── howl-logo.svg          # HOWL wordmark — replace with your file
│   ├── howl-hero.svg          # Fallback hero (orange flowers on black)
│   └── favicon.svg
├── src/
│   ├── App.jsx                # Intake, running, report — single file
│   ├── data/
│   │   └── rubric.js          # Signals, surfaces, categories, playbooks
│   ├── index.css              # HOWL design tokens + Tailwind v4 import
│   └── main.jsx
├── index.html
├── package.json
├── vercel.json
├── vite.config.js
└── README.md
```

---

## Customising the framework

- **Add/edit signals**: `SIGNALS` in `src/data/rubric.js`. Six is hard-coded into the chart wedge calculation — if you change the count, update the `segAngle` math in `RadialStackedBars` (it's a single line: `360 / SIGNALS.length` is already there, so the chart will adapt automatically as long as labels still fit).
- **Add/edit surfaces**: `SURFACES` in the same file. The chart stacks them in array order from inside-out and uses the `color` field for the band fill.
- **Edit categories or business models**: `CATEGORIES` / `BUSINESS_MODELS`.
- **Tune the AI voice**: `buildSystemPrompt()` in `src/App.jsx`. Explicit rules are easy to dial up or down.
- **Swap models**: change the `model` field in the `runRead` body. Default is `claude-sonnet-4-6`.

---

## Design tokens (`src/index.css`)

| Token | Hex | Role |
|-------|-----|------|
| `--howl-cream` | `#F2EFE7` | Page background |
| `--howl-ink` | `#0A0A0A` | Primary type, borders, ink blocks |
| `--howl-coral` | `#F47245` | Accent — CTAs, score highlights, hover |
| `--howl-coral-deep` | `#D85726` | Pressed states, deep coral fills |
| `--howl-bone` | `#FAF7EF` | Card surfaces |
| `--howl-strong / mid / weak` | `#1F7A4D` / `#C28A1F` / `#B73525` | Score tiers |

Display type is Anton (condensed grotesque, matching the deck). Body is Inter.

---

© 2026 HOWL, by Antenna Group.
