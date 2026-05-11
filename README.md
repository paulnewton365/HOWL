# HOWL READ

**A diagnostic tool for impact brands.** From HOWL, by Antenna Group.

The READ scores a brand across six signals — VOLUME, INTEGRATION, IDENTITY, CANDOR, DESIRE, MOMENTUM — and returns recommendations split into **EDGE** (strategic moves) and **PLAY** (creative provocations).

The thesis is HOWL's: sustainability has been whispering at the same volume and frequency as everyone else. The READ is the diagnostic that tells a brand exactly where the whisper is.

---

## What it does

1. The user submits a brand name, website URL, impact category, and optional context.
2. Claude (with web_search enabled) reads the brand's public surfaces — homepage, sustainability page, recent campaigns, earned coverage.
3. The model returns a structured JSON read scored across six signals.
4. The app renders a single-page report: verdict, hexagon radar, per-signal cards with evidence, EDGE recommendations, PLAY recommendations.

The last READ is cached in `localStorage` so the user can come back to it without re-running.

---

## The six signals

| Signal | Question it answers |
|--------|---------------------|
| **VOLUME** | Are you cutting through, or whispering at the same frequency as everyone else? |
| **INTEGRATION** | Is sustainability woven into the brand, or quarantined in an ESG silo? |
| **IDENTITY** | Is impact embodied in who you are, or communicated as a side note? |
| **CANDOR** | Are you showing scars as well as vision, or only the polished aspiration? |
| **DESIRE** | Are you inviting people into a future they want, or instructing them to comply? |
| **MOMENTUM** | Are you earning cultural attention, or fading quietly into the feed? |

Verdict tiers: **0–39 Whispering · 40–69 Speaking · 70–100 Howling.** Overall score is the mean of the six signal scores.

The full framework, including strong/moderate/weak signal indicators and the EDGE/PLAY playbooks, lives in `src/data/rubric.js`.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7 |
| Styling | Tailwind CSS 4 + hand-written HOWL design tokens in `src/index.css` |
| Icons | Lucide React |
| AI | Anthropic Claude (`claude-sonnet-4-6`) with `web_search` tool |
| Backend | Vercel serverless function (`api/claude.js`) |
| Hosting | Vercel |

No database. No auth. The READ is a diagnostic, not a portfolio tool — last result lives in `localStorage` only.

---

## Local development

```bash
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm run dev
```

`vite dev` does not run the `/api/claude` serverless function. For local end-to-end testing, install the Vercel CLI and run `vercel dev`:

```bash
npm i -g vercel
vercel dev
```

---

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Add a single environment variable:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

4. Deploy. Vercel auto-detects Vite from `vercel.json`.

The API key is server-side only — it is never exposed to the browser. The client posts to `/api/claude`, which proxies to Anthropic with the key attached.

---

## Project structure

```
howl-read/
├── api/
│   └── claude.js              # Anthropic proxy (Vercel serverless function)
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx                # Single-file app: intake, running, report
│   ├── data/
│   │   └── rubric.js          # 6 signals, verdict tiers, playbooks
│   ├── index.css              # HOWL design tokens + Tailwind v4 import
│   └── main.jsx
├── index.html
├── package.json
├── vercel.json                # Build config and SPA rewrite (excludes /api/)
├── vite.config.js
└── README.md
```

---

## Customising the framework

- **Adjust signals**: edit `SIGNALS` in `src/data/rubric.js`. The radar will re-shape automatically as long as you keep the same number of points (six is hard-coded as a hexagon — if you change the count, update `HexagonRadar`).
- **Adjust the verdict copy**: edit `VERDICT_TIERS` in the same file.
- **Adjust the AI voice**: edit `buildSystemPrompt()` in `src/App.jsx`. The voice rules are explicit and easy to tune.
- **Swap the model**: change the `model` field in the `runRead` body. Defaults to `claude-sonnet-4-6`.

---

## Design tokens

| Token | Hex | Role |
|-------|-----|------|
| `--howl-cream` | `#F2EFE7` | Page background |
| `--howl-ink` | `#0A0A0A` | Primary type, borders, bold ink blocks |
| `--howl-coral` | `#F47245` | The HOWL accent — buttons, score highlights, hover |
| `--howl-bone` | `#FAF7EF` | Card surfaces |
| `--howl-strong / mid / weak` | `#1F7A4D / #C28A1F / #B73525` | Score tiers |

Display type is Anton (condensed grotesque, matches the deck). Body is Inter.

---

© 2026 HOWL, by Antenna Group.
