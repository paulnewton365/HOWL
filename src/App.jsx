import { useState, useEffect, useMemo } from 'react';
import {
  SIGNALS,
  CATEGORIES,
  BUSINESS_MODELS,
  SURFACES,
  SURFACE_IDS,
  VERDICT_TIERS,
  getVerdict,
  FRAMEWORK_VERSION,
} from './data/rubric';
import pkg from '../package.json';
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

// Auto-incremented on every build via scripts/bump-version.cjs.
const APP_VERSION = pkg.version;

// Official HOWL logo, served from HOWL's CDN. Single source of truth — if the
// agency updates the mark, every deployed instance picks it up automatically.
const HOWL_LOGO_URL =
  'https://cdn.prod.website-files.com/69121686b7e8b054bf157020/691216e49d8ba654eba2919e_howl-logo.svg';

// ============================================================================
// HOWL LOGO
// ============================================================================

function HowlLogo({ height = 38, inverted = false }) {
  // The CDN SVG is ink on transparent. CSS invert flips it for dark contexts.
  const style = inverted ? { filter: 'invert(1)' } : {};
  return (
    <img
      src={HOWL_LOGO_URL}
      alt="HOWL"
      style={{ height: `${height}px`, display: 'block', ...style }}
    />
  );
}

// ============================================================================
// BUILD BADGE — pinned bottom-right of every screen. Format: 1.1.1
// ============================================================================

function BuildBadge() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        right: '0.75rem',
        bottom: '0.75rem',
        fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        fontSize: '10px',
        letterSpacing: '0.08em',
        color: 'var(--howl-mute)',
        opacity: 0.55,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      {APP_VERSION}
    </div>
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
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <HowlLogo height={32} />
          <div
            className="hidden sm:block pl-4"
            style={{ borderLeft: '1.5px solid var(--howl-ink)' }}
          >
            <div className="howl-stamp" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              READ
            </div>
            <div
              className="text-[10px] tracking-[0.15em] uppercase"
              style={{ color: 'var(--howl-mute)' }}
            >
              The brand diagnostic
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
// INTAKE — expanded form: brand, URL, category, business model, social,
// AI engine descriptions, additional context.
// ============================================================================

function IntakeForm({ onSubmit, disabled }) {
  const [brandName, setBrandName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [category, setCategory] = useState('tech');
  const [businessModel, setBusinessModel] = useState('b2c');
  const [context, setContext] = useState('');
  const [error, setError] = useState('');
  const [heroError, setHeroError] = useState(false);

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
        businessModel,
        context: context.trim(),
      });
    } catch {
      setError('That URL does not look right.');
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 howl-fadein">
      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* Left: hero image + headline */}
        <div className="lg:col-span-2 lg:sticky lg:top-8">
          <div className="mb-5">
            <div
              className="howl-stamp mb-3"
              style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}
            >
              The READ — v{FRAMEWORK_VERSION}
            </div>
            <h1
              className="font-display"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
            >
              Stop whispering.<br />
              <span style={{ color: 'var(--howl-coral)' }}>Find out where.</span>
            </h1>
          </div>

          <div
            className="card-howl overflow-hidden"
            style={{ aspectRatio: '4 / 5', borderColor: 'var(--howl-ink)' }}
          >
            {!heroError ? (
              <img
                src="/howl-hero.jpg"
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={() => setHeroError(true)}
              />
            ) : (
              <img
                src="/howl-hero.svg"
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </div>

          <p
            className="text-base mt-5"
            style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.5 }}
          >
            A diagnostic from HOWL that reads how loudly — and how convincingly —
            your brand is carrying its story across <strong>website, social,
            reputation, and earned</strong>. Six signals. Four surfaces. One verdict.
          </p>
        </div>

        {/* Right: the form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 card-howl p-7 space-y-6">
          <div className="howl-stamp" style={{ fontSize: '0.9375rem' }}>
            01 — Tell us the brand
          </div>

          <div>
            <label className="label-howl" htmlFor="brand">Brand</label>
            <input
              id="brand"
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Patagonia, Liquid Death, Notion, Glossier…"
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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label-howl" htmlFor="cat">Category</label>
              <select
                id="cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-howl"
                disabled={disabled}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-howl" htmlFor="bm">Business model</label>
              <select
                id="bm"
                value={businessModel}
                onChange={(e) => setBusinessModel(e.target.value)}
                className="input-howl"
                disabled={disabled}
              >
                {BUSINESS_MODELS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="howl-stamp pt-2"
            style={{ fontSize: '0.9375rem', borderTop: '1px solid var(--howl-cream-deep)', paddingTop: '1.25rem' }}
          >
            02 — Sharpen the READ <span style={{ fontWeight: 400, fontSize: '0.75rem', textTransform: 'none', letterSpacing: 0, color: 'var(--howl-mute)' }}>(optional)</span>
          </div>

          <div>
            <label className="label-howl" htmlFor="ctx">
              Anything else we should know
            </label>
            <textarea
              id="ctx"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Recent campaigns, links to coverage, Glassdoor/Trustpilot snippets, certifications, or any social handles you want us to focus on. Sharper inputs make a sharper READ."
              className="input-howl"
              rows={4}
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
            The READ uses public information across the brand's website, social, third-party reputation surfaces, and earned media. It automatically discovers the brand's social handles and samples how Claude describes the brand. It evaluates messaging signals, not internal performance.
          </p>
        </form>
      </div>
    </main>
  );
}

// ============================================================================
// RUNNING — loading state
// ============================================================================

function RunningRead({ brandName, stage }) {
  const lines = useMemo(
    () => [
      'Asking Claude what it knows about the brand.',
      'Reading the homepage.',
      'Listening for category cliché.',
      'Scanning the social feeds.',
      'Checking what third-party sources say.',
      'Looking at earned media from the last twelve months.',
      'Counting scars in the latest claims.',
      'Watching for guilt vs. invitation in the copy.',
      'Scoring the four surfaces.',
      'Writing the verdict.',
    ],
    []
  );
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % lines.length), 2000);
    return () => clearInterval(t);
  }, [lines.length]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center howl-fadein">
      <div
        className="howl-stamp mb-3"
        style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}
      >
        {stage === 'ai-sample'
          ? 'Sampling AI representation'
          : stage === 'social'
          ? 'Finding social presence'
          : 'Running the READ'}
      </div>
      <h2 className="font-display mb-8" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
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
        This usually takes 30–90 seconds. Claude is reading the brand's actual surfaces.
      </p>
    </main>
  );
}

// ============================================================================
// RADIAL STACKED BAR CHART
// 6 signal wedges. Each wedge stacks 4 surface scores radially from center.
// Outer edge = sum of all surface scores. Inner band labels follow segment angle.
// ============================================================================

function RadialStackedBars({ signals, size = 520 }) {
  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.10;
  const outerR = size * 0.40;
  const labelR = size * 0.46;
  const segAngle = 360 / SIGNALS.length;       // 60° per signal
  const gapDeg = 6;                            // visual gap between wedges
  const arcDeg = segAngle - gapDeg;
  const maxStack = 400;                        // 4 surfaces × 100 each

  function polar(angleDeg, r) {
    const a = (angleDeg - 90) * (Math.PI / 180);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }

  // Arc path between two angles at given inner/outer radius (an annular sector)
  function annularSectorPath(startDeg, endDeg, rIn, rOut) {
    const [x1, y1] = polar(startDeg, rOut);
    const [x2, y2] = polar(endDeg, rOut);
    const [x3, y3] = polar(endDeg, rIn);
    const [x4, y4] = polar(startDeg, rIn);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${x1} ${y1}`,
      `A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');
  }

  // Background reference rings (25/50/75/100 of max stack)
  const rings = [0.25, 0.5, 0.75, 1.0].map((p) => ({
    r: innerR + (outerR - innerR) * p,
    pct: Math.round(p * 100),
  }));

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      style={{ maxWidth: size, height: 'auto', display: 'block', margin: '0 auto' }}
      aria-label="Radial stacked bar chart of HOWL READ scores"
    >
      {/* Reference rings */}
      {rings.map((ring, i) => (
        <circle
          key={ring.r}
          cx={cx}
          cy={cy}
          r={ring.r}
          fill="none"
          stroke="var(--howl-ink)"
          strokeOpacity={i === rings.length - 1 ? 0.4 : 0.12}
          strokeWidth={1}
          strokeDasharray={i === rings.length - 1 ? '0' : '3 4'}
        />
      ))}

      {/* Inner cream hole */}
      <circle cx={cx} cy={cy} r={innerR} fill="var(--howl-cream)" stroke="var(--howl-ink)" strokeOpacity={0.4} />

      {/* Signal wedges with stacked surface bars */}
      {SIGNALS.map((sig, i) => {
        const startAngle = i * segAngle + gapDeg / 2;
        const endAngle = startAngle + arcDeg;
        const midAngle = (startAngle + endAngle) / 2;
        const sigData = signals[sig.id];
        if (!sigData) return null;

        // Each surface adds (score / maxStack) of the available radial range
        let cursorR = innerR;
        const stacks = SURFACES.map((surface) => {
          const score = sigData.by_surface?.[surface.id] ?? 0;
          const span = (score / maxStack) * (outerR - innerR);
          const from = cursorR;
          const to = cursorR + span;
          cursorR = to;
          return { surface, from, to, score };
        });

        // Label position
        const [lx, ly] = polar(midAngle, labelR);

        return (
          <g key={sig.id}>
            {stacks.map(({ surface, from, to }) =>
              to > from ? (
                <path
                  key={surface.id}
                  d={annularSectorPath(startAngle, endAngle, from, to)}
                  fill={surface.color}
                  stroke="var(--howl-cream)"
                  strokeWidth={1.5}
                />
              ) : null
            )}

            {/* Signal label */}
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontFamily: 'Anton, Inter, sans-serif',
                fontSize: '16px',
                fill: 'var(--howl-ink)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {sig.name}
            </text>
            <text
              x={lx}
              y={ly + 18}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                fill: 'var(--howl-coral-deep)',
                letterSpacing: '0.04em',
              }}
            >
              {sigData.score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// LEGEND
// ============================================================================

function SurfaceLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center pt-2">
      {SURFACES.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              background: s.color,
            }}
          />
          <span
            className="howl-stamp"
            style={{ fontSize: '0.6875rem', letterSpacing: '0.12em' }}
          >
            {s.name}
          </span>
        </div>
      ))}
    </div>
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
      if (s.by_surface) {
        const parts = SURFACES.map(
          (su) => `${su.name} ${s.by_surface[su.id] ?? 0}`
        ).join(' · ');
        lines.push(`  surfaces: ${parts}`);
      }
      if (s.evidence?.length) {
        s.evidence.forEach((e) => lines.push(`  • ${e}`));
      }
      lines.push('');
    });
    lines.push('— EDGE —');
    (report.edge || []).forEach((r) => lines.push(`${r.title}: ${r.rationale}`));
    lines.push('');
    lines.push('— PLAY —');
    (report.play || []).forEach((r) => lines.push(`${r.title}: ${r.rationale}`));
    if (report.ai_description) {
      lines.push('');
      lines.push('— WHAT CLAUDE SAYS ABOUT YOU (unprompted, no web search) —');
      lines.push(report.ai_description);
    }
    if (report.social_handles) {
      lines.push('');
      lines.push('— SOCIAL PRESENCE WE FOUND —');
      SOCIAL_PLATFORMS.forEach((k) => {
        const v = report.social_handles[k];
        lines.push(`${SOCIAL_LABELS[k]}: ${v || 'not found'}`);
      });
    }
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 howl-fadein">
      {/* Verdict header */}
      <div className="mb-10">
        <div className="howl-stamp mb-2" style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}>
          The READ — {brandMeta.brandName}
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="font-display" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
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
            <div className="font-display" style={{ fontSize: '4rem', color: 'var(--howl-coral)' }}>
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

      {/* Radial chart + summary */}
      <div className="grid md:grid-cols-5 gap-6 mb-12">
        <div className="card-howl p-6 md:col-span-3">
          <div className="howl-stamp mb-4" style={{ fontSize: '0.8125rem' }}>
            Six Signals × Four Surfaces
          </div>
          <RadialStackedBars signals={report.signals} />
          <SurfaceLegend />
          <p className="text-xs text-center mt-4" style={{ color: 'var(--howl-mute)' }}>
            Each wedge is a signal. Each band inside the wedge is a surface score. Longer wedge = louder.
          </p>
        </div>
        <div className="card-howl p-6 md:col-span-2">
          <div className="howl-stamp mb-4" style={{ fontSize: '0.8125rem' }}>The Read</div>
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
                  <span className="howl-stamp" style={{ fontSize: '0.8125rem' }}>{sig.name}</span>
                  <div className="flex items-center gap-3 flex-1 mx-3">
                    <div className="flex-1 h-2 relative" style={{ background: 'var(--howl-cream-deep)' }}>
                      <div
                        className="absolute inset-y-0 left-0"
                        style={{ width: `${s.score}%`, background: scoreColor(s.score) }}
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

      {/* Per-signal cards with surface breakdown */}
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
                  <div className="font-display" style={{ fontSize: '1.625rem', lineHeight: 1 }}>
                    {sig.name}
                  </div>
                  <div
                    className="font-display"
                    style={{ fontSize: '2rem', lineHeight: 1, color: scoreColor(s.score) }}
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

                {/* Surface mini-bars */}
                {s.by_surface && (
                  <div className="pt-4 mb-4" style={{ borderTop: '1px solid var(--howl-cream-deep)' }}>
                    <div className="text-[10px] tracking-[0.15em] uppercase mb-3 font-bold" style={{ color: 'var(--howl-mute)' }}>
                      By Surface
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {SURFACES.map((surface) => {
                        const ss = s.by_surface[surface.id] ?? 0;
                        return (
                          <div key={surface.id} className="flex items-center gap-2">
                            <span style={{ width: 8, height: 8, background: surface.color, display: 'inline-block' }} />
                            <span className="text-[11px] tracking-wide uppercase font-semibold flex-1" style={{ color: 'var(--howl-ink-soft)' }}>
                              {surface.name}
                            </span>
                            <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(ss) }}>
                              {ss}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {s.evidence && s.evidence.length > 0 && (
                  <div className="pt-4" style={{ borderTop: '1px solid var(--howl-cream-deep)' }}>
                    <div className="text-[10px] tracking-[0.15em] uppercase mb-2 font-bold" style={{ color: 'var(--howl-mute)' }}>
                      Evidence
                    </div>
                    <ul className="space-y-1.5">
                      {s.evidence.map((e, i) => (
                        <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--howl-ink-soft)' }}>
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

      <RecommendationBlock
        label="EDGE"
        sublabel="Strategic moves to sharpen who you are."
        icon={<Zap size={20} />}
        recommendations={report.edge || []}
        bg="var(--howl-ink)"
        fg="var(--howl-bone)"
        accent="var(--howl-ink)"
      />

      <RecommendationBlock
        label="PLAY"
        sublabel="Creative provocations to earn attention beyond the feed."
        icon={<Sparkles size={20} />}
        recommendations={report.play || []}
        bg="var(--howl-coral)"
        fg="var(--howl-ink)"
        accent="var(--howl-coral)"
      />

      {(report.ai_description || report.social_handles) && (
        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {report.ai_description && (
            <div>
              <div
                className="howl-stamp mb-3"
                style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}
              >
                What Claude says about you
              </div>
              <div
                className="card-howl p-6 h-full"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: 'var(--howl-coral)',
                  background: 'var(--howl-bone)',
                }}
              >
                <p
                  className="text-base"
                  style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.6 }}
                >
                  {report.ai_description}
                </p>
                <p
                  className="text-[11px] mt-4 pt-3"
                  style={{
                    color: 'var(--howl-mute)',
                    borderTop: '1px solid var(--howl-cream-deep)',
                    letterSpacing: '0.04em',
                  }}
                >
                  Sampled from Claude with no web search — this is your footprint in AI training data. If this reads thin, vague, or wrong, that is a REPUTATION finding in its own right.
                </p>
              </div>
            </div>
          )}

          {report.social_handles && (
            <div>
              <div
                className="howl-stamp mb-3"
                style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}
              >
                Social presence we found
              </div>
              <div
                className="card-howl p-6 h-full"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: 'var(--howl-coral)',
                  background: 'var(--howl-bone)',
                }}
              >
                <ul className="space-y-2">
                  {SOCIAL_PLATFORMS.map((k) => {
                    const v = report.social_handles[k];
                    return (
                      <li key={k} className="flex items-baseline gap-3 text-sm">
                        <span
                          className="howl-stamp shrink-0 w-24"
                          style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}
                        >
                          {SOCIAL_LABELS[k]}
                        </span>
                        <span
                          style={{
                            color: v ? 'var(--howl-ink)' : 'var(--howl-mute)',
                            fontFamily: v ? 'ui-monospace, monospace' : 'inherit',
                            fontSize: v ? '0.8125rem' : '0.8125rem',
                            wordBreak: 'break-all',
                            fontStyle: v ? 'normal' : 'italic',
                          }}
                        >
                          {v || 'not found'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p
                  className="text-[11px] mt-4 pt-3"
                  style={{
                    color: 'var(--howl-mute)',
                    borderTop: '1px solid var(--howl-cream-deep)',
                    letterSpacing: '0.04em',
                  }}
                >
                  Verified via web search at READ time. Platforms gate feed content behind logins, so SOCIAL is scored on discoverable presence and indexed posts — not deep feed analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

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

function RecommendationBlock({ label, sublabel, icon, recommendations, bg, fg, accent }) {
  if (!recommendations || recommendations.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="p-6 mb-5" style={{ background: bg, color: fg, border: `1.5px solid ${accent}` }}>
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
        <p className="mb-5" style={{ color: 'var(--howl-ink-soft)' }}>{error}</p>
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
// PROMPT BUILDERS — brand-agnostic, surface-aware
// ============================================================================

function buildSystemPrompt() {
  const signalSpec = SIGNALS.map(
    (s) =>
      `### ${s.id} — ${s.name}\n` +
      `Question: ${s.question}\n` +
      `Thesis: ${s.thesis}\n` +
      `Strong: ${s.strong.join('; ')}\n` +
      `Moderate: ${s.moderate.join('; ')}\n` +
      `Weak: ${s.weak.join('; ')}\n`
  ).join('\n');

  const surfaceSpec = SURFACES.map(
    (s) =>
      `### ${s.id} — ${s.name}\n` +
      `Covers: ${s.description}\n` +
      `Look for: ${s.looks_for.join('; ')}\n`
  ).join('\n');

  return `You are the analytical engine behind HOWL READ — a brand diagnostic from HOWL, a creative agency born inside Antenna Group.

HOWL's thesis applies to any brand, not only sustainability or impact brands:
- Everyone is shouting at the same volume, at the same frequency, at the same time. The truth stands out. Real doesn't compete; it commands.
- Consequential brands do not communicate values, they embody them. Distinctiveness is identity, not message.
- Show scars AND vision. Round-numbered aspiration without methodology is a red flag, not a green one.
- Marketing works when it connects to identity, not duty. Benefit. Authenticity. Desire. Momentum.
- The job is to move brands from performative to meaningful, from safe to believed.

You speak in HOWL's voice: direct, sharp, observational, anti-corporate. No hedged consultant language. No "journey" clichés. No "leveraging", "ecosystem", "stakeholders" — unless mocking them. You name what you see. You do not lecture.

You score brands across SIX SIGNALS (each 0-100):

${signalSpec}

You evaluate each signal across FOUR EVIDENCE SURFACES (each 0-100):

${surfaceSpec}

Use web_search aggressively before scoring. For each brand you read:
1. Fetch the homepage and About page.
2. Search for the brand's recent social posts on LinkedIn, Instagram, X, TikTok, YouTube.
3. Search for what the brand is reviewed for on Trustpilot, Glassdoor, Reddit, App stores.
4. Search for tier-one earned media coverage from the last 12 months.
5. Note how publicly accessible AI information describes the brand.

You ALWAYS produce specific evidence rooted in what the brand actually does on its public surfaces. You name pages, campaigns, partners, language patterns, headlines. No generic statements like "their website discusses sustainability".

Return STRICT JSON only. No prose outside the JSON. No code fences. The schema is:

{
  "verdict": "1-2 sentence pull-quote in HOWL voice naming the brand's current stance",
  "summary": "3-4 sentence read of where the brand stands overall — sharp, specific, no hedging",
  "signals": {
    "VOLUME":      { "score": <int 0-100, average of by_surface>, "read": "2-3 sentences in HOWL voice", "by_surface": {"WEBSITE": <int>, "SOCIAL": <int>, "REPUTATION": <int>, "EARNED": <int>}, "evidence": ["specific observation", "specific observation", "specific observation"] },
    "INTEGRATION": { ... },
    "IDENTITY":    { ... },
    "CANDOR":      { ... },
    "DESIRE":      { ... },
    "MOMENTUM":    { ... }
  },
  "edge": [
    { "title": "Short verb-led name", "rationale": "1-2 sentences in HOWL voice on what this strategic move does and why for THIS brand", "addresses": ["SIGNAL_ID", "SIGNAL_ID"] }
  ],
  "play": [
    { "title": "Short verb-led name", "rationale": "1-2 sentences in HOWL voice on the creative provocation and why it's earnable for THIS brand", "addresses": ["SIGNAL_ID"] }
  ]
}

Scoring rules:
- The "score" for each signal MUST equal the rounded average of its four by_surface scores. The client will verify and recompute this if inconsistent.
- Score honestly. Most brands fall in 30-65 range. Reserve 70+ for genuinely strong signals with real evidence. 85+ should be rare.
- Surface scores can diverge meaningfully within a single signal — e.g., VOLUME may be 75 on WEBSITE but 35 on EARNED. Surface that pattern in the "read".
- Evidence MUST be specific. Name the page, the campaign, the partner, the language pattern.
- Voice: HOWL. Short sentences.
- 3 EDGE recommendations and 3 PLAY recommendations. Each addresses the weakest signals. Each is BRAND-SPECIFIC — invent the move for THIS brand, not generic agency boilerplate.
- "addresses" arrays use UPPERCASE signal IDs: VOLUME, INTEGRATION, IDENTITY, CANDOR, DESIRE, MOMENTUM.
- Return ONLY the JSON object. No markdown fences. No preamble.`;
}

function buildUserPrompt({ brandName, websiteUrl, category, businessModel, socials, aiSummary, context }) {
  const cat = CATEGORIES.find((c) => c.id === category)?.name || 'Other';
  const bm = BUSINESS_MODELS.find((b) => b.id === businessModel)?.name || 'B2C';
  const lines = [
    `Brand: ${brandName}`,
    `Website: ${websiteUrl}`,
    `Category: ${cat}`,
    `Business model: ${bm}`,
  ];
  if (socials) lines.push(`\nAuto-discovered social handles (verified via web search at READ time — focus the SOCIAL surface evaluation on these):\n${socials}`);
  if (aiSummary) lines.push(`\nUnprompted AI representation (Claude's description of the brand from training data, captured at READ time without web search):\n${aiSummary}`);
  if (context) lines.push(`\nAdditional context the user provided:\n${context}`);
  lines.push(
    `\nRun the READ. Use web_search to look at the brand's website, social presence, third-party reputation surfaces (Trustpilot, Glassdoor, Reddit, AI engine descriptions), and earned media from the last 12 months. Then return the JSON.`
  );
  return lines.join('\n');
}

// ============================================================================
// RESPONSE PARSING + NORMALIZATION
// ============================================================================

function extractJson(text) {
  if (!text) throw new Error('Empty response from Claude.');
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON object found in response.');
  return JSON.parse(cleaned.slice(first, last + 1));
}

function normalizeReport(raw) {
  const signals = {};
  let total = 0;
  let count = 0;
  SIGNALS.forEach((sig) => {
    const s = raw.signals?.[sig.id];
    if (!s) {
      signals[sig.id] = { score: 0, read: '', evidence: [], by_surface: zeroSurfaces() };
      return;
    }
    const by_surface = {};
    let surfaceTotal = 0;
    let surfaceCount = 0;
    SURFACE_IDS.forEach((id) => {
      const v = s.by_surface?.[id];
      const clamped = typeof v === 'number' ? Math.max(0, Math.min(100, Math.round(v))) : 0;
      by_surface[id] = clamped;
      surfaceTotal += clamped;
      surfaceCount += 1;
    });
    // Signal score = mean of surfaces (recompute to ensure consistency)
    const score = surfaceCount > 0 ? Math.round(surfaceTotal / surfaceCount) : 0;
    signals[sig.id] = {
      score,
      read: s.read || '',
      evidence: Array.isArray(s.evidence) ? s.evidence.slice(0, 6) : [],
      by_surface,
    };
    total += score;
    count += 1;
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

function zeroSurfaces() {
  const o = {};
  SURFACE_IDS.forEach((id) => { o[id] = 0; });
  return o;
}

// ============================================================================
// AI REPRESENTATION SAMPLE
// Quick unprompted Claude call (no web search) to capture how the model
// describes the brand from training data alone. Feeds the REPUTATION read.
// ============================================================================

async function fetchAiDescription(brandName, websiteUrl) {
  const prompt = `What is "${brandName}" (${websiteUrl})? Give a concise, factual 3-5 sentence description as if responding to a user asking you about this brand. Cover what they do, who their audience is, and what they're known for.

If you do not have reliable information about this brand, say so explicitly — e.g. "I don't have reliable information about [BRAND]." Do not invent or guess. Do not search the web. Respond based only on what you know.`;

  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        temperature: 0,
        useWebSearch: false,
      }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return (
      data.text ||
      (data.content || [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n') ||
      ''
    );
  } catch {
    return ''; // graceful degrade — main READ continues without it
  }
}

// ============================================================================
// SOCIAL HANDLE DISCOVERY
// Quick web-search Claude call to find the brand's verified social accounts.
// Caveat: even with handles in hand, deep feed content is gated by platform
// login walls. The SOCIAL surface scores discoverable presence + indexed posts
// + third-party reports, not full feed analysis.
// ============================================================================

const SOCIAL_PLATFORMS = ['linkedin', 'instagram', 'x', 'tiktok', 'youtube', 'facebook'];
const SOCIAL_LABELS = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X / Twitter',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
};

async function fetchSocialHandles(brandName, websiteUrl) {
  const prompt = `Find the official social media accounts for the brand "${brandName}" (${websiteUrl}). Use web_search to confirm verified or clearly official accounts on each platform. Prefer accounts linked from the brand's own website footer or About page.

Return ONLY a JSON object in this exact shape. Use a handle ("@example") or full URL for each platform you can verify. Use null where you cannot find a clearly official account. Do not guess. Do not invent handles.

{
  "linkedin": "https://www.linkedin.com/company/example" or null,
  "instagram": "@example" or null,
  "x": "@example" or null,
  "tiktok": "@example" or null,
  "youtube": "Channel name or URL" or null,
  "facebook": "URL or page name" or null
}

Return only the JSON. No prose, no code fences.`;

  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        temperature: 0,
        useWebSearch: true,
        webSearchMaxUses: 3,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text =
      data.text ||
      (data.content || [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
    const parsed = extractJson(text);
    // Normalize to a flat object with only the known keys
    const out = {};
    SOCIAL_PLATFORMS.forEach((k) => {
      const v = parsed?.[k];
      out[k] = typeof v === 'string' && v.trim() ? v.trim() : null;
    });
    // If everything came back null, treat as no result
    if (SOCIAL_PLATFORMS.every((k) => !out[k])) return null;
    return out;
  } catch {
    return null;
  }
}

function formatSocialsForPrompt(handles) {
  if (!handles) return '';
  const lines = SOCIAL_PLATFORMS
    .filter((k) => handles[k])
    .map((k) => `${SOCIAL_LABELS[k]}: ${handles[k]}`);
  return lines.length ? lines.join('\n') : '';
}

// ============================================================================
// APP
// ============================================================================

const STORAGE_KEY = 'howl-read:last';

export default function App() {
  const [view, setView] = useState('intake');
  const [stage, setStage] = useState(null); // 'ai-sample' | 'social' | 'main' | null
  const [brandMeta, setBrandMeta] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      // Step 1 — unprompted AI description (no web search)
      setStage('ai-sample');
      const aiDescription = await fetchAiDescription(meta.brandName, meta.websiteUrl);

      // Step 2 — social handle discovery (web search, narrow budget)
      setStage('social');
      const socialHandles = await fetchSocialHandles(meta.brandName, meta.websiteUrl);
      const socialsStr = formatSocialsForPrompt(socialHandles);

      // Step 3 — main READ with everything injected
      setStage('main');
      const enrichedMeta = {
        ...meta,
        aiSummary: aiDescription,
        socials: socialsStr,
      };

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: buildSystemPrompt(),
          messages: [{ role: 'user', content: buildUserPrompt(enrichedMeta) }],
          model: 'claude-sonnet-4-6',
          max_tokens: 10000,
          temperature: 0,
          useWebSearch: true,
          webSearchMaxUses: 8,
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
      normalized.ai_description = aiDescription;
      normalized.social_handles = socialHandles;

      setReport(normalized);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ brandMeta: meta, report: normalized })
        );
      } catch { /* ignore */ }
      setView('report');
    } catch (e) {
      console.error(e);
      setError(e.message || 'Something went wrong running the READ.');
      setView('error');
    } finally {
      setStage(null);
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
      {view === 'running' && (
        <RunningRead brandName={brandMeta?.brandName || ''} stage={stage} />
      )}
      {view === 'report' && report && brandMeta && (
        <ReadReport report={report} onReset={reset} brandMeta={brandMeta} />
      )}
      {view === 'error' && <ErrorScreen error={error} onBack={reset} />}
      <BuildBadge />
    </div>
  );
}
