# HOWL READ

**A brand diagnostic.** From HOWL, by Antenna Group.

The READ scores any brand across six signals. VOLUME, INTEGRATION, IDENTITY, CANDOR, DESIRE, MOMENTUM, evaluated across four evidence surfaces (Website, Social, Reputation, Earned). It returns a verdict (Whispering / Speaking / Howling) and recommendations split into **EDGE** (strategy) and **PLAY** (creative provocations).

The thesis is HOWL's: brands have been shouting at the same volume, frequency, and time as everyone else. The READ is the diagnostic that tells a brand exactly where the whisper is, and what to do about it.

---

## What it does

1. The user submits a brand name, website URL, category, business model, and optional context.
2. The app fires a quick unprompted Claude call (no web search) to capture how Claude describes the brand from training data alone. Anchors the REPUTATION read.
3. A second quick Claude call (web search, narrow budget) discovers the brand's official social handles across LinkedIn, Instagram, X, TikTok, YouTube, Facebook. Anchors the SOCIAL read.
4. The main READ call (web search, full budget) reads the brand across four evidence surfaces, website, social, third-party reputation surfaces (AI engines, reviews, Glassdoor, Reddit, certifications), and earned media from the last 12 months. The AI description and social handles from steps 2 and 3 are passed in as anchors.
5. Each of the six signals gets a score on each of the four surfaces. Signal scores are the mean of the four surface scores. Overall = mean of signal scores.
6. The report renders a radial stacked-bar chart, per-signal cards with surface breakdowns and evidence, brand-specific EDGE and PLAY recommendations, the captured AI description, and the discovered social handles.

Three Claude calls per READ: one unprompted (~$0.005), one social discovery with narrow web search (~$0.03), one main READ with web search (~$0.10). Last READ is cached in `localStorage` so the user can come back to it without re-running.

**Honest limitation on SOCIAL:** Even with handles discovered, platforms (LinkedIn, Instagram, TikTok) gate feed content behind login walls. The SOCIAL surface evaluates *discoverable presence + Google-indexed posts + third-party reports*, not deep feed analysis. This is the weakest of the four surfaces for any AI-driven brand diagnostic, true of HOWL READ and true of every other tool in the category.

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

| Asset | Source | How to swap |
|-------|--------|-------------|
| **Logo** | Loaded directly from HOWL's Webflow CDN (`cdn.prod.website-files.com`) | Edit `HOWL_LOGO_URL` at the top of `src/App.jsx` if the canonical URL changes |
| **Hero image** | `public/howl-hero.jpg` with `howl-hero.svg` as fallback | Drop your photo at `public/howl-hero.jpg`, the app picks it up automatically. If missing, the SVG fallback renders. |

Loading the logo from HOWL's CDN means a logo update on the agency site flows through to every deployed instance without redeploy. If you want the logo bundled into the build instead (offline-safe), save the SVG locally to `public/howl-logo.svg` and change `HOWL_LOGO_URL` to `/howl-logo.svg`.

---

## Versioning

The app version is shown bottom-right of every screen (e.g. `1.1.1`).

- Format: `MAJOR.MINOR.PATCH`
- **PATCH** auto-increments on every build via `scripts/bump-version.cjs`, which runs as a `prebuild` hook. This happens both locally on `npm run build` and on every Vercel deploy.
- **MAJOR** and **MINOR** are manual, bump them in `package.json` when shipping a meaningful release.
- The framework version (`FRAMEWORK_VERSION` in `src/data/rubric.js`) is separate. That tracks rubric changes (signals, surfaces, scoring) and is bumped manually when you change the diagnostic itself.

A note on Vercel CI: each Vercel build runs `prebuild`, which bumps the patch in that build's working copy of `package.json`. The change is **not** committed back to the repo, so the version you see on a Vercel preview reflects that deploy's build, not the latest committed version. If you want monotonic versioning across deploys, commit the bumped `package.json` from your local builds before pushing.

---

## Determinism

`temperature` is set to `0` in `src/App.jsx` so re-running the READ on the same brand produces stable scores and copy. Two caveats:

- The model can still vary slightly between runs because `web_search` results change as the web changes. Same brand, different week, different evidence.
- If you want to lock results in time for a specific report, copy the READ (button at the bottom of the report) and archive it.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7 |
| Styling | Tailwind CSS 4 + hand-written HOWL design tokens in `src/index.css` |
| Icons | Lucide React |
| Charts | Custom SVG radial stacked-bar, no chart library |
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
│   ├── howl-logo.svg          # HOWL wordmark, replace with your file
│   ├── howl-hero.svg          # Fallback hero (orange flowers on black)
│   └── favicon.svg
├── src/
│   ├── App.jsx                # Intake, running, report, single file
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

- **Add/edit signals**: `SIGNALS` in `src/data/rubric.js`. Six is hard-coded into the chart wedge calculation, if you change the count, update the `segAngle` math in `RadialStackedBars` (it's a single line: `360 / SIGNALS.length` is already there, so the chart will adapt automatically as long as labels still fit).
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
| `--howl-coral` | `#F47245` | Accent. CTAs, score highlights, hover |
| `--howl-coral-deep` | `#D85726` | Pressed states, deep coral fills |
| `--howl-bone` | `#FAF7EF` | Card surfaces |
| `--howl-strong / mid / weak` | `#1F7A4D` / `#C28A1F` / `#B73525` | Score tiers |

Display type is Anton (condensed grotesque, matching the deck). Body is Inter.

---

© 2026 HOWL, by Antenna Group.
