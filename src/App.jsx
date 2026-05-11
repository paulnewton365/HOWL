import { useState, useEffect, useMemo, useRef } from 'react';
import {
  SIGNALS,
  IMPACT_CATEGORIES,
  VERDICT_TIERS,
  getVerdict,
  EDGE_PLAYBOOK,
  PLAY_PLAYBOOK,
  FRAMEWORK_VERSION,
} from './data/rubric';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Megaphone,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';

// ============================================================================
// HOWL LOGO — a typographic stamp. No external SVG required.
// ============================================================================

function HowlMark({ className = '' }) {
  return (
    <span
      className={`howl-stamp inline-flex items-center ${className}`}
      style={{
        background: 'var(--howl-ink)',
        color: 'var(--howl-bone)',
        padding: '0.35rem 0.7rem',
        fontSize: '1.5rem',
        letterSpacing: '0.02em',
      }}
    >
      HOWL
    </span>
  );
}

// ============================================================================
// HEADER
// ============================================================================

function Header({ onReset, showReset }) {
  return (
    <header
      style={{
        borderBottom: '1.5px solid var(--howl-ink)',
        background: 'var(--howl-cream)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HowlMark />
          <div className="hidden sm:block">
            <div
              className="howl-stamp"
              style={{ fontSize: '1.5rem', lineHeight: 1 }}
            >
              READ
            </div>
            <div
              className="text-[10px] tracking-[0.15em] uppercase"
              style={{ color: 'var(--howl-mute)' }}
            >
              A diagnostic for impact brands
            </div>
          </div>
        </div>
        {showReset && (
          <button onClick={onReset} className="btn-ghost">
            <RefreshCw size={14} />
            New READ
          </button>
        )}
      </div>
    </header>
  );
}

// ============================================================================
// INTAKE — the form that collects what we need to run the READ
// ============================================================================

function IntakeForm({ onSubmit, disabled }) {
  const [brandName, setBrandName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [category, setCategory] = useState('circular');
  const [context, setContext] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!brandName.trim()) return setError('Brand name is required.');
    if (!websiteUrl.trim()) return setError('Website URL is required.');
    try {
      const u = new URL(
        websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`
      );
      onSubmit({
        brandName: brandName.trim(),
        websiteUrl: u.toString(),
        category,
        context: context.trim(),
      });
    } catch {
      setError('That URL does not look right.');
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 howl-fadein">
      {/* Hero block — HOWL voice */}
      <div className="mb-10">
        <div
          className="howl-stamp mb-3"
          style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}
        >
          The READ — v{FRAMEWORK_VERSION}
        </div>
        <h1
          className="font-display mb-5"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          Stop whispering.<br />
          <span style={{ color: 'var(--howl-coral)' }}>Find out where.</span>
        </h1>
        <p
          className="text-lg max-w-2xl"
          style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.5 }}
        >
          A diagnostic from HOWL that reads how loudly — and how convincingly —
          your brand is carrying its impact story. Six signals. One verdict.
          Recommendations for EDGE and PLAY.
        </p>
      </div>

      {/* The form */}
      <form onSubmit={handleSubmit} className="card-howl p-7 space-y-6">
        <div>
          <label className="label-howl" htmlFor="brand">Brand</label>
          <input
            id="brand"
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Patagonia, Allbirds, Beyond Meat…"
            className="input-howl"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="label-howl" htmlFor="url">Website</label>
          <input
            id="url"
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://"
            className="input-howl"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="label-howl" htmlFor="cat">Impact category</label>
          <select
            id="cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-howl"
            disabled={disabled}
          >
            {IMPACT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-howl" htmlFor="ctx">
            Anything we should know <span style={{ color: 'var(--howl-mute)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <textarea
            id="ctx"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Paste copy from the sustainability page, a recent campaign description, links to coverage, or anything else worth surfacing. The more sharp inputs, the sharper the READ."
            className="input-howl"
            rows={5}
            disabled={disabled}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        {error && (
          <div
            className="flex items-start gap-2 p-3"
            style={{
              border: '1.5px solid var(--howl-weak)',
              background: 'rgba(183, 53, 37, 0.08)',
              color: 'var(--howl-weak)',
            }}
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <button type="submit" disabled={disabled} className="btn-howl w-full justify-center">
          {disabled ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Running the READ…
            </>
          ) : (
            <>
              <Megaphone size={16} />
              Run the READ
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className="text-xs" style={{ color: 'var(--howl-mute)' }}>
          The READ uses public information. It surfaces messaging signals, not internal performance.
        </p>
      </form>
    </main>
  );
}

// ============================================================================
// RUNNING — loading state with rotating HOWL-voice progress lines
// ============================================================================

function RunningRead({ brandName }) {
  const lines = useMemo(
    () => [
      'Reading the homepage.',
      'Listening for category cliché.',
      'Checking whether sustainability sits inside the brand or beside it.',
      'Counting scars in the latest report.',
      'Watching for guilt vs. invitation in the copy.',
      'Looking for earned attention, not just paid push.',
      'Scoring the six signals.',
      'Writing the verdict.',
    ],
    []
  );
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % lines.length), 1800);
    return () => clearInterval(t);
  }, [lines.length]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center howl-fadein">
      <div
        className="howl-stamp mb-3"
        style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}
      >
        Running the READ
      </div>
      <h2
        className="font-display mb-8"
        style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
      >
        {brandName}
      </h2>
      <div className="flex items-center justify-center gap-3 mb-3">
        <Loader2 size={18} className="animate-spin" style={{ color: 'var(--howl-coral)' }} />
        <span
          key={idx}
          className="howl-fadein text-base"
          style={{ color: 'var(--howl-ink-soft)' }}
        >
          {lines[idx]}
        </span>
      </div>
      <p className="text-xs mt-10" style={{ color: 'var(--howl-mute)' }}>
        This usually takes 30–60 seconds. Claude is reading the brand's actual surfaces.
      </p>
    </main>
  );
}

// ============================================================================
// HEXAGON RADAR — six signals, no chart library
// ============================================================================

function HexagonRadar({ signals, size = 440 }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
  const labelR = size * 0.44;

  // Top is VOLUME, going clockwise. Start angle = -90° (top).
  const points = SIGNALS.map((sig, i) => {
    const angle = (-90 + (360 / 6) * i) * (Math.PI / 180);
    return {
      id: sig.id,
      name: sig.name,
      angle,
      score: signals[sig.id]?.score ?? 0,
    };
  });

  function pointAt(angle, r) {
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  }

  // Background concentric hexagons (25/50/75/100)
  const rings = [0.25, 0.5, 0.75, 1].map((scale) => {
    const ringPts = points
      .map((p) => pointAt(p.angle, maxR * scale).join(','))
      .join(' ');
    return { scale, ringPts };
  });

  // Score polygon
  const scorePts = points
    .map((p) => pointAt(p.angle, maxR * (p.score / 100)).join(','))
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      style={{ maxWidth: size, height: 'auto', display: 'block', margin: '0 auto' }}
      aria-label="Hexagon radar of the six HOWL signals"
    >
      {/* Rings */}
      {rings.map(({ scale, ringPts }) => (
        <polygon
          key={scale}
          points={ringPts}
          fill="none"
          stroke="var(--howl-ink)"
          strokeOpacity={scale === 1 ? 0.8 : 0.18}
          strokeWidth={scale === 1 ? 1.5 : 1}
        />
      ))}

      {/* Axes */}
      {points.map((p) => {
        const [x, y] = pointAt(p.angle, maxR);
        return (
          <line
            key={p.id}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--howl-ink)"
            strokeOpacity={0.18}
            strokeWidth={1}
          />
        );
      })}

      {/* Score polygon */}
      <polygon
        points={scorePts}
        fill="var(--howl-coral)"
        fillOpacity={0.42}
        stroke="var(--howl-coral-deep)"
        strokeWidth={2}
      />

      {/* Score dots */}
      {points.map((p) => {
        const [x, y] = pointAt(p.angle, maxR * (p.score / 100));
        return (
          <circle
            key={p.id}
            cx={x}
            cy={y}
            r={4.5}
            fill="var(--howl-ink)"
          />
        );
      })}

      {/* Labels */}
      {points.map((p) => {
        const [x, y] = pointAt(p.angle, labelR);
        const anchor =
          Math.abs(Math.cos(p.angle)) < 0.2
            ? 'middle'
            : Math.cos(p.angle) > 0
            ? 'start'
            : 'end';
        return (
          <g key={p.id}>
            <text
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              style={{
                fontFamily: 'Anton, Inter, sans-serif',
                fontSize: '15px',
                fill: 'var(--howl-ink)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {p.name}
            </text>
            <text
              x={x}
              y={y + 16}
              textAnchor={anchor}
              dominantBaseline="middle"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                fill: 'var(--howl-coral-deep)',
                letterSpacing: '0.04em',
              }}
            >
              {p.score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// REPORT
// ============================================================================

function ReadReport({ report, onReset, brandMeta }) {
  const overall = report.overall_score;
  const verdict = getVerdict(overall);
  const [copied, setCopied] = useState(false);

  function scoreColor(score) {
    if (score >= 70) return 'var(--howl-strong)';
    if (score >= 40) return 'var(--howl-mid)';
    return 'var(--howl-weak)';
  }

  function copyText() {
    const lines = [];
    lines.push(`THE READ — ${brandMeta.brandName.toUpperCase()}`);
    lines.push(`Overall: ${overall} — ${verdict.name}`);
    lines.push(verdict.headline);
    lines.push('');
    lines.push(report.verdict);
    lines.push('');
    if (report.summary) {
      lines.push(report.summary);
      lines.push('');
    }
    lines.push('— SIGNALS —');
    SIGNALS.forEach((sig) => {
      const s = report.signals[sig.id];
      if (!s) return;
      lines.push(`${sig.name.toUpperCase()} — ${s.score}`);
      lines.push(s.read);
      if (s.evidence?.length) {
        s.evidence.forEach((e) => lines.push(`  • ${e}`));
      }
      lines.push('');
    });
    lines.push('— EDGE —');
    (report.edge || []).forEach((r) => {
      lines.push(`${r.title}: ${r.rationale}`);
    });
    lines.push('');
    lines.push('— PLAY —');
    (report.play || []).forEach((r) => {
      lines.push(`${r.title}: ${r.rationale}`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 howl-fadein">
      {/* Header strip */}
      <div className="mb-10">
        <div
          className="howl-stamp mb-2"
          style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}
        >
          The READ — {brandMeta.brandName}
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div
              className="font-display"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
            >
              {verdict.name.toUpperCase()}.
            </div>
            <p
              className="text-xl mt-2 max-w-2xl"
              style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.35 }}
            >
              {verdict.headline}
            </p>
          </div>
          <div
            className="card-howl p-5 text-center shrink-0"
            style={{ minWidth: 160, background: 'var(--howl-ink)', color: 'var(--howl-bone)', borderColor: 'var(--howl-ink)' }}
          >
            <div className="text-[10px] tracking-[0.15em] uppercase opacity-70">Overall</div>
            <div
              className="font-display"
              style={{ fontSize: '4rem', color: 'var(--howl-coral)' }}
            >
              {overall}
            </div>
            <div className="text-[10px] tracking-[0.15em] uppercase opacity-70">/ 100</div>
          </div>
        </div>
      </div>

      {/* Verdict pull-quote */}
      {report.verdict && (
        <div
          className="mb-10 p-6"
          style={{
            borderLeft: '4px solid var(--howl-coral)',
            background: 'var(--howl-bone)',
            border: '1.5px solid var(--howl-ink)',
            borderLeftWidth: '4px',
            borderLeftColor: 'var(--howl-coral)',
          }}
        >
          <p className="text-xl leading-snug" style={{ fontStyle: 'italic' }}>
            "{report.verdict}"
          </p>
        </div>
      )}

      {/* Hexagon + summary side by side */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card-howl p-6">
          <div className="howl-stamp mb-4" style={{ fontSize: '0.8125rem' }}>
            Six Signals
          </div>
          <HexagonRadar signals={report.signals} />
        </div>
        <div className="card-howl p-6">
          <div className="howl-stamp mb-4" style={{ fontSize: '0.8125rem' }}>
            The Read
          </div>
          {report.summary && (
            <p
              className="text-base mb-5"
              style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.55 }}
            >
              {report.summary}
            </p>
          )}
          <div className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--howl-cream-deep)' }}>
            {SIGNALS.map((sig) => {
              const s = report.signals[sig.id];
              if (!s) return null;
              return (
                <div key={sig.id} className="flex items-center justify-between text-sm">
                  <span className="howl-stamp" style={{ fontSize: '0.875rem' }}>{sig.name}</span>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div
                      className="flex-1 h-2 relative"
                      style={{ background: 'var(--howl-cream-deep)' }}
                    >
                      <div
                        className="absolute inset-y-0 left-0"
                        style={{
                          width: `${s.score}%`,
                          background: scoreColor(s.score),
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className="font-bold tabular-nums w-8 text-right"
                    style={{ color: scoreColor(s.score) }}
                  >
                    {s.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Per-signal cards */}
      <div className="mb-12">
        <h2 className="font-display mb-6" style={{ fontSize: '2rem' }}>
          The signals, signal by signal.
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {SIGNALS.map((sig) => {
            const s = report.signals[sig.id];
            if (!s) return null;
            return (
              <div key={sig.id} className="card-howl p-6">
                <div className="flex items-baseline justify-between mb-3">
                  <div
                    className="font-display"
                    style={{ fontSize: '1.625rem', lineHeight: 1 }}
                  >
                    {sig.name}
                  </div>
                  <div
                    className="font-display"
                    style={{
                      fontSize: '2rem',
                      lineHeight: 1,
                      color: scoreColor(s.score),
                    }}
                  >
                    {s.score}
                  </div>
                </div>
                <p
                  className="text-sm mb-4"
                  style={{ color: 'var(--howl-mute)', fontStyle: 'italic' }}
                >
                  {sig.question}
                </p>
                <p
                  className="text-base mb-4"
                  style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.55 }}
                >
                  {s.read}
                </p>
                {s.evidence && s.evidence.length > 0 && (
                  <div className="pt-4" style={{ borderTop: '1px solid var(--howl-cream-deep)' }}>
                    <div
                      className="text-[10px] tracking-[0.15em] uppercase mb-2 font-bold"
                      style={{ color: 'var(--howl-mute)' }}
                    >
                      Evidence
                    </div>
                    <ul className="space-y-1.5">
                      {s.evidence.map((e, i) => (
                        <li
                          key={i}
                          className="text-sm flex gap-2"
                          style={{ color: 'var(--howl-ink-soft)' }}
                        >
                          <span style={{ color: 'var(--howl-coral)' }}>—</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EDGE recommendations */}
      <RecommendationBlock
        label="EDGE"
        sublabel="Strategic moves to sharpen who you are."
        icon={<Zap size={20} />}
        recommendations={report.edge || []}
        accent="var(--howl-ink)"
        bg="var(--howl-ink)"
        fg="var(--howl-bone)"
      />

      {/* PLAY recommendations */}
      <RecommendationBlock
        label="PLAY"
        sublabel="Creative provocations to earn attention beyond the feed."
        icon={<Sparkles size={20} />}
        recommendations={report.play || []}
        accent="var(--howl-coral)"
        bg="var(--howl-coral)"
        fg="var(--howl-ink)"
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center pt-6">
        <button onClick={copyText} className="btn-ghost">
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy the READ</>}
        </button>
        <button onClick={() => window.print()} className="btn-ghost">
          <Printer size={14} />
          Print
        </button>
        <button onClick={onReset} className="btn-howl">
          <RefreshCw size={14} />
          Run a new READ
        </button>
      </div>

      <div
        className="text-center text-[10px] tracking-[0.15em] uppercase mt-12 pt-6"
        style={{ color: 'var(--howl-mute)', borderTop: '1px solid var(--howl-cream-deep)' }}
      >
        HOWL READ v{FRAMEWORK_VERSION} — A diagnostic from HOWL, by Antenna Group
      </div>
    </main>
  );
}

// ============================================================================
// RECOMMENDATION BLOCK — used for EDGE and PLAY
// ============================================================================

function RecommendationBlock({ label, sublabel, icon, recommendations, bg, fg, accent }) {
  if (!recommendations || recommendations.length === 0) return null;
  return (
    <div className="mb-10">
      <div
        className="p-6 mb-5"
        style={{ background: bg, color: fg, border: `1.5px solid ${accent}` }}
      >
        <div className="flex items-center gap-3 mb-1">
          {icon}
          <div className="font-display" style={{ fontSize: '2.25rem', lineHeight: 1 }}>
            {label}
          </div>
        </div>
        <p className="text-sm opacity-85">{sublabel}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {recommendations.map((r, i) => (
          <div key={i} className="card-howl p-5">
            <div className="flex items-start justify-between mb-2 gap-3">
              <div className="font-display" style={{ fontSize: '1.25rem', lineHeight: 1.1 }}>
                {r.title}
              </div>
              <div className="flex gap-1 flex-wrap shrink-0 max-w-[40%] justify-end">
                {(r.addresses || []).map((a) => (
                  <span key={a} className="tag-howl outline" style={{ fontSize: '0.625rem' }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.55 }}>
              {r.rationale}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ERROR
// ============================================================================

function ErrorScreen({ error, onBack }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 howl-fadein">
      <div className="card-howl p-7" style={{ borderColor: 'var(--howl-weak)' }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={20} style={{ color: 'var(--howl-weak)' }} />
          <div className="howl-stamp" style={{ fontSize: '1rem', color: 'var(--howl-weak)' }}>
            The READ stalled
          </div>
        </div>
        <p className="mb-5" style={{ color: 'var(--howl-ink-soft)' }}>
          {error}
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--howl-mute)' }}>
          If this keeps happening, check that <code>ANTHROPIC_API_KEY</code> is set
          on your Vercel environment, and that the brand URL is reachable.
        </p>
        <button onClick={onBack} className="btn-howl">
          <ArrowLeft size={14} />
          Try again
        </button>
      </div>
    </main>
  );
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

function buildSystemPrompt() {
  const signalSpec = SIGNALS.map(
    (s) =>
      `### ${s.id} — ${s.name}\n` +
      `Question: ${s.question}\n` +
      `Thesis: ${s.thesis}\n` +
      `Strong signals: ${s.strong.join('; ')}\n` +
      `Moderate signals: ${s.moderate.join('; ')}\n` +
      `Weak signals: ${s.weak.join('; ')}\n`
  ).join('\n');

  return `You are the analytical engine behind HOWL READ — a diagnostic tool from HOWL, a creative agency for sustainability and impact leaders born inside Antenna Group.

HOWL's thesis:
- Sustainability has been whispering in a room where everyone is shouting. At the same volume. At the same frequency. At the same time.
- The narrative has gone numb. "Sustainability" now signals obligation, complexity, and compromise — the opposite of what it actually is.
- Consequential brands do not communicate impact, they embody it. Impact is identity, not message.
- Show scars AND vision. Inauthenticity is invisibility. Round-numbered aspiration without methodology is a red flag, not a green one.
- Sustainability messaging works when it connects to identity, not guilt. Benefit. Authenticity. Desire. Momentum.
- The job is to move brands from performative to meaningful, from safe to believed.

You speak in HOWL's voice: direct, sharp, observational, anti-corporate. No hedged consultant language. No "sustainability journey" clichés. You name what you see. You do not lecture.

You score brands across SIX signals (0-100 each):

${signalSpec}

You ALWAYS produce specific evidence rooted in what the brand actually does on its public surfaces. You web_search the brand's website, sustainability page, news coverage, and recent campaigns before scoring. You quote nothing verbatim — you describe and assess.

You return STRICT JSON only. No prose outside the JSON. No code fences. The schema is:

{
  "verdict": "1-2 sentence pull-quote in HOWL voice naming the brand's current stance",
  "summary": "3-4 sentence read of where the brand stands overall — sharp, specific, no hedging",
  "signals": {
    "VOLUME":      { "score": <int 0-100>, "read": "2-3 sentences in HOWL voice", "evidence": ["specific observation", "specific observation", "specific observation"] },
    "INTEGRATION": { "score": <int 0-100>, "read": "...", "evidence": [...] },
    "IDENTITY":    { "score": <int 0-100>, "read": "...", "evidence": [...] },
    "CANDOR":      { "score": <int 0-100>, "read": "...", "evidence": [...] },
    "DESIRE":      { "score": <int 0-100>, "read": "...", "evidence": [...] },
    "MOMENTUM":    { "score": <int 0-100>, "read": "...", "evidence": [...] }
  },
  "edge": [
    { "title": "Short verb-led name", "rationale": "1-2 sentences in HOWL voice on what this strategic move does and why for THIS brand", "addresses": ["SIGNAL_ID", "SIGNAL_ID"] }
  ],
  "play": [
    { "title": "Short verb-led name", "rationale": "1-2 sentences in HOWL voice on the creative provocation and what makes it earnable for THIS brand", "addresses": ["SIGNAL_ID"] }
  ]
}

Rules:
- Score honestly. Most brands score in the 30-60 range. Reserve 70+ for genuinely strong signals with real evidence. 85+ should be rare.
- Evidence MUST be specific to this brand. No generic statements like "their website discusses sustainability". Name the page, the campaign, the partner, the language pattern.
- Voice: HOWL. Short sentences. No "navigating", "leveraging", "ecosystem", "stakeholders" unless you are mocking them.
- 3 EDGE recommendations and 3 PLAY recommendations. Each addresses one or more of the weakest signals. Each is BRAND-SPECIFIC — invent the move for this brand, do not give generic agency boilerplate.
- "addresses" arrays use the signal IDs in UPPERCASE: VOLUME, INTEGRATION, IDENTITY, CANDOR, DESIRE, MOMENTUM.
- Return ONLY the JSON object. No markdown fences. No preamble. No closing remarks.`;
}

function buildUserPrompt({ brandName, websiteUrl, category, context }) {
  const cat = IMPACT_CATEGORIES.find((c) => c.id === category)?.name || 'Other';
  return `Brand: ${brandName}
Website: ${websiteUrl}
Impact category: ${cat}
${context ? `\nAdditional context the user provided:\n${context}` : ''}

Run the READ. Use web_search to look at the brand's homepage, sustainability or impact page, recent campaigns, and any earned coverage from the last 12 months. Then return the JSON.`;
}

// ============================================================================
// RESPONSE PARSING — tolerant of fences, preambles, trailing text
// ============================================================================

function extractJson(text) {
  if (!text) throw new Error('Empty response from Claude.');
  let cleaned = text.trim();
  // Strip code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  // Find first { and matching last }
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) {
    throw new Error('No JSON object found in response.');
  }
  const slice = cleaned.slice(first, last + 1);
  return JSON.parse(slice);
}

function normalizeReport(raw) {
  // Validate signals and compute overall score
  const signals = {};
  let total = 0;
  let count = 0;
  SIGNALS.forEach((sig) => {
    const s = raw.signals?.[sig.id];
    if (s && typeof s.score === 'number') {
      const clamped = Math.max(0, Math.min(100, Math.round(s.score)));
      signals[sig.id] = {
        score: clamped,
        read: s.read || '',
        evidence: Array.isArray(s.evidence) ? s.evidence.slice(0, 6) : [],
      };
      total += clamped;
      count += 1;
    } else {
      signals[sig.id] = { score: 0, read: '', evidence: [] };
    }
  });
  const overall = count > 0 ? Math.round(total / count) : 0;

  return {
    overall_score: overall,
    verdict: raw.verdict || '',
    summary: raw.summary || '',
    signals,
    edge: Array.isArray(raw.edge) ? raw.edge.slice(0, 4) : [],
    play: Array.isArray(raw.play) ? raw.play.slice(0, 4) : [],
  };
}

// ============================================================================
// APP — state machine + persistence
// ============================================================================

const STORAGE_KEY = 'howl-read:last';

export default function App() {
  const [view, setView] = useState('intake');
  const [brandMeta, setBrandMeta] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Restore last report if present (nice on reload)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { brandMeta: bm, report: r } = JSON.parse(raw);
        if (bm && r) {
          setBrandMeta(bm);
          setReport(r);
          setView('report');
        }
      }
    } catch { /* ignore */ }
  }, []);

  async function runRead(meta) {
    setError('');
    setSubmitting(true);
    setBrandMeta(meta);
    setView('running');

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: buildSystemPrompt(),
          messages: [{ role: 'user', content: buildUserPrompt(meta) }],
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          temperature: 0.2,
          useWebSearch: true,
          webSearchMaxUses: 6,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Server returned ${res.status}.`);
      }

      const data = await res.json();
      const text =
        data.text ||
        (data.content || [])
          .filter((b) => b.type === 'text')
          .map((b) => b.text)
          .join('\n');

      const raw = extractJson(text);
      const normalized = normalizeReport(raw);

      setReport(normalized);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ brandMeta: meta, report: normalized })
        );
      } catch { /* ignore quota errors */ }
      setView('report');
    } catch (e) {
      console.error(e);
      setError(e.message || 'Something went wrong running the READ.');
      setView('error');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setReport(null);
    setBrandMeta(null);
    setError('');
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setView('intake');
  }

  return (
    <div>
      <Header onReset={reset} showReset={view !== 'intake'} />
      {view === 'intake' && <IntakeForm onSubmit={runRead} disabled={submitting} />}
      {view === 'running' && <RunningRead brandName={brandMeta?.brandName || ''} />}
      {view === 'report' && report && brandMeta && (
        <ReadReport report={report} onReset={reset} brandMeta={brandMeta} />
      )}
      {view === 'error' && <ErrorScreen error={error} onBack={reset} />}
    </div>
  );
}
