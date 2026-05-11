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
  EDGE_PLAYBOOK,
  PLAY_PLAYBOOK,
  BELIEF_DIMENSIONS,
  BELIEF_IDS,
} from './data/rubric';
import pkg from '../package.json';
import {
  getPassword,
  setPassword,
  clearPassword,
  hasPassword,
  passwordHeaders,
} from './lib/auth';
import {
  saveRead,
  fetchRecentReads,
  fetchReadById,
  deleteRead,
  supabaseEnabled,
} from './lib/supabase';
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
  Lock,
  LogOut,
  Trash2,
  Clock,
} from 'lucide-react';

// Auto-incremented on every build via scripts/bump-version.cjs.
const APP_VERSION = pkg.version;

// Official HOWL logo, served from HOWL's CDN. Single source of truth, if the
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
// BUILD BADGE, pinned bottom-right of every screen. Format: 1.1.1
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

// ============================================================================
// PASSWORD GATE — gates the whole app behind a server-validated password.
// ============================================================================

function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(() => hasPassword());
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!input.trim()) return;
    setChecking(true);
    try {
      const res = await fetch('/api/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input.trim() }),
      });
      if (res.ok) {
        setPassword(input.trim());
        setAuthed(true);
      } else {
        setError('Wrong password.');
      }
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setChecking(false);
    }
  }

  if (authed) return children;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <main className="howl-fadein" style={{ width: '100%', maxWidth: 420, padding: '2rem 1.5rem' }}>
        <div className="flex items-center gap-3 mb-6">
          <HowlLogo height={28} />
          <div style={{ borderLeft: '1.5px solid var(--howl-ink)', paddingLeft: '0.75rem' }}>
            <div className="howl-stamp" style={{ fontSize: '1rem', lineHeight: 1 }}>
              THE READ
            </div>
          </div>
        </div>

        <h1
          className="font-display"
          style={{ fontSize: 'clamp(1.875rem, 4vw, 2.5rem)', lineHeight: 1.05, marginBottom: '1rem' }}
        >
          Members only.
        </h1>
        <p style={{ color: 'var(--howl-ink-soft)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          The Read is a HOWL tool. Sign in with the password your team gave you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-howl" htmlFor="pwd">Password</label>
            <input
              id="pwd"
              type="password"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="input-howl"
              disabled={checking}
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

          <button type="submit" disabled={checking} className="btn-howl w-full justify-center">
            {checking ? <><Loader2 size={16} className="animate-spin" /> Checking</> : <><Lock size={14} /> Sign in</>}
          </button>
        </form>
      </main>
    </div>
  );
}

// ============================================================================
// VERDICT STAMP — small pill showing Whispering / Speaking / Howling
// ============================================================================

function VerdictStamp({ score, size = 'sm' }) {
  const v = getVerdict(score);
  const padding = size === 'sm' ? '3px 8px' : '5px 12px';
  const fontSize = size === 'sm' ? '0.625rem' : '0.75rem';
  return (
    <span
      className="howl-stamp"
      style={{
        background: v.color,
        color: 'var(--howl-bone)',
        padding,
        fontSize,
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
      }}
    >
      {v.name}
    </span>
  );
}

// ============================================================================
// PREVIOUS READS — list of past reads from Supabase. Shown on intake view.
// ============================================================================

function PreviousReads({ onLoad, onRerun }) {
  const [reads, setReads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false);
      return;
    }
    fetchRecentReads().then((data) => {
      setReads(data);
      setLoading(false);
    });
  }, []);

  if (!supabaseEnabled) return null;
  if (loading) return null;
  if (!reads.length) return null;

  async function handleDelete(id) {
    setBusyId(id);
    const ok = await deleteRead(id);
    if (ok) setReads((rs) => rs.filter((r) => r.id !== id));
    setBusyId(null);
  }

  return (
    <section
      className="mt-16 pt-10"
      style={{ borderTop: '1px solid var(--howl-cream-deep)' }}
    >
      <div className="flex items-center gap-3 mb-5">
        <Clock size={18} style={{ color: 'var(--howl-coral)' }} />
        <h2 className="font-display" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
          Previous Reads
        </h2>
      </div>

      <div className="space-y-2">
        {reads.map((r) => {
          const date = new Date(r.created_at);
          const dateStr = date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          return (
            <div
              key={r.id}
              className="card-howl flex items-center gap-3 p-3 hover:bg-[var(--howl-bone)] transition-colors"
              style={{ cursor: 'pointer' }}
              onClick={() => onLoad(r)}
            >
              <div className="flex-1 min-w-0">
                <div
                  className="font-display truncate"
                  style={{ fontSize: '1.0625rem', lineHeight: 1.1 }}
                >
                  {r.brand_name}
                </div>
                <div
                  className="text-[11px] tracking-wide uppercase mt-1"
                  style={{ color: 'var(--howl-mute)' }}
                >
                  {dateStr}
                </div>
              </div>
              <div
                className="font-display tabular-nums shrink-0"
                style={{ fontSize: '1.75rem', lineHeight: 1, color: 'var(--howl-ink)' }}
              >
                {r.overall_score}
              </div>
              <div className="shrink-0">
                <VerdictStamp score={r.overall_score} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRerun(r);
                }}
                className="btn-ghost shrink-0"
                title="Run this READ again"
                style={{ padding: '6px 10px' }}
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(r.id);
                }}
                disabled={busyId === r.id}
                title="Delete"
                className="shrink-0"
                style={{
                  padding: '6px 8px',
                  color: 'var(--howl-mute)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {busyId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Header({ onReset, showReset, onSignOut }) {
  return (
    <header
      style={{
        borderBottom: '1.5px solid var(--howl-ink)',
        background: 'var(--howl-cream)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <HowlLogo height={32} />
          <div
            className="hidden sm:block pl-4"
            style={{ borderLeft: '1.5px solid var(--howl-ink)' }}
          >
            <div className="howl-stamp" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              THE READ
            </div>
            <div
              className="text-[10px] tracking-[0.15em] uppercase"
              style={{ color: 'var(--howl-mute)' }}
            >
              A brand diagnostic
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showReset && (
            <button onClick={onReset} className="btn-ghost">
              <RefreshCw size={14} />
              New READ
            </button>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="btn-ghost"
              title="Sign out"
              style={{ padding: '6px 10px' }}
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// INTAKE, expanded form: brand, URL, category, business model, social,
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
              The Read, v{FRAMEWORK_VERSION}
            </div>
            <h1
              className="font-display"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
            >
              Stop whispering.<br />
              <span style={{ color: 'var(--howl-coral)' }}>Learn to howl.</span>
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
            A diagnostic from HOWL that reads how loudly, and how convincingly,
            your brand is carrying its story across <strong>website, social,
            reputation, and earned</strong>. Six signals. Four surfaces. One verdict.
          </p>
        </div>

        {/* Right: the form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 card-howl p-7 space-y-6">
          <div className="howl-stamp" style={{ fontSize: '0.9375rem' }}>
            01. Tell us the brand
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
            02. Sharpen the READ <span style={{ fontWeight: 400, fontSize: '0.75rem', textTransform: 'none', letterSpacing: 0, color: 'var(--howl-mute)' }}>(optional)</span>
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
// RUNNING, loading state
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
        {stage === 'discovery'
          ? 'Sampling AI and social presence'
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
  // Animate wedges and numbers in on mount
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    const duration = 900; // ms
    let rafId;
    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.12;
  const outerR = size * 0.40;
  const labelR = size * 0.45;
  const padX = 90;
  const segAngle = 360 / SIGNALS.length;
  const gapDeg = 6;
  const arcDeg = segAngle - gapDeg;
  const maxStack = 400;

  function polar(angleDeg, r) {
    const a = (angleDeg - 90) * (Math.PI / 180);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }

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

  // Anchor label to the side of the chart it sits on so long names never clip.
  function labelAnchor(angleDeg) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    const cosVal = Math.cos(rad);
    if (Math.abs(cosVal) < 0.2) return 'middle';
    return cosVal > 0 ? 'start' : 'end';
  }

  // Reference rings at 25/50/75/100 of the stack max
  const rings = [0.25, 0.5, 0.75, 1.0].map((p) => ({
    r: innerR + (outerR - innerR) * p,
    outermost: p === 1.0,
  }));

  return (
    <svg
      viewBox={`${-padX} 0 ${size + 2 * padX} ${size}`}
      width="100%"
      style={{ maxWidth: size + 2 * padX, height: 'auto', display: 'block', margin: '0 auto' }}
      aria-label="Radial stacked bar chart of HOWL READ scores"
    >
      {/* Reference rings */}
      {rings.map((ring) => (
        <circle
          key={ring.r}
          cx={cx}
          cy={cy}
          r={ring.r}
          fill="none"
          stroke="var(--howl-ink)"
          strokeOpacity={ring.outermost ? 0.28 : 0.08}
          strokeWidth={1}
          strokeDasharray={ring.outermost ? '0' : '2 4'}
        />
      ))}

      {/* Inner cream hole */}
      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        fill="var(--howl-cream)"
        stroke="var(--howl-ink)"
        strokeOpacity={0.25}
      />

      {/* Signal wedges with stacked surface bars */}
      {SIGNALS.map((sig, i) => {
        const startAngle = i * segAngle + gapDeg / 2;
        const endAngle = startAngle + arcDeg;
        const midAngle = (startAngle + endAngle) / 2;
        const sigData = signals[sig.id];
        if (!sigData) return null;

        let cursorR = innerR;
        const stacks = SURFACES.map((surface) => {
          const score = sigData.by_surface?.[surface.id] ?? 0;
          const span = ((score * progress) / maxStack) * (outerR - innerR);
          const from = cursorR;
          const to = cursorR + span;
          cursorR = to;
          return { surface, from, to };
        });

        const anchor = labelAnchor(midAngle);
        const [lx, ly] = polar(midAngle, labelR);
        const displayScore = Math.round((sigData.score || 0) * progress);

        return (
          <g key={sig.id}>
            {stacks.map(({ surface, from, to }) =>
              to > from ? (
                <path
                  key={surface.id}
                  d={annularSectorPath(startAngle, endAngle, from, to)}
                  fill={surface.color}
                  stroke="var(--howl-cream)"
                  strokeWidth={1}
                />
              ) : null
            )}

            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              style={{
                fontFamily: 'Anton, Inter, sans-serif',
                fontSize: '13px',
                fill: 'var(--howl-ink)',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}
            >
              {sig.name}
            </text>
            <text
              x={lx}
              y={ly + 19}
              textAnchor={anchor}
              dominantBaseline="middle"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                fill: 'var(--howl-ink-soft)',
                letterSpacing: '0.01em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {displayScore}
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
    lines.push(`THE READ · ${brandMeta.brandName.toUpperCase()}`);
    lines.push(`Overall: ${overall} (${verdict.name})`);
    lines.push(verdict.headline);
    lines.push('');
    lines.push(report.verdict);
    lines.push('');
    if (report.summary) {
      lines.push(report.summary);
      lines.push('');
    }
    lines.push('## SIGNALS ##');
    SIGNALS.forEach((sig) => {
      const s = report.signals[sig.id];
      if (!s) return;
      lines.push(`${sig.name.toUpperCase()}: ${s.score}`);
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
    if (report.belief) {
      lines.push('## THE BELIEF READ ##');
      BELIEF_DIMENSIONS.forEach((d) => {
        const data = report.belief[d.id];
        if (!data) return;
        lines.push(`${d.name.toUpperCase()}: ${data.score ?? '–'}`);
        if (data.read) lines.push(data.read);
        lines.push('');
      });
      if (report.belief.summary) {
        lines.push(report.belief.summary);
        lines.push('');
      }
    }
    lines.push('## EDGE ##');
    (report.edge || []).forEach((r) => lines.push(`${r.title}: ${r.rationale}`));
    lines.push('');
    lines.push('## PLAY ##');
    (report.play || []).forEach((r) => lines.push(`${r.title}: ${r.rationale}`));
    if (report.ai_description) {
      lines.push('');
      lines.push('## WHAT CLAUDE SAYS ABOUT YOU (unprompted, no web search) ##');
      lines.push(report.ai_description);
    }
    if (report.social_handles) {
      lines.push('');
      lines.push('## SOCIAL PRESENCE WE FOUND ##');
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
          The READ, {brandMeta.brandName}
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
                          <span style={{ color: 'var(--howl-coral)' }}>·</span>
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

      <BeliefSection belief={report.belief} />

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
                  Sampled from Claude with no web search, this is your footprint in AI training data. If this reads thin, vague, or wrong, that is a REPUTATION finding in its own right.
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
                  Verified via web search at READ time. Platforms gate feed content behind logins, so SOCIAL is scored on discoverable presence and indexed posts, not deep feed analysis.
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
        The Read v{FRAMEWORK_VERSION}. A diagnostic from HOWL, by Antenna Group
      </div>
    </main>
  );
}

function BeliefSection({ belief }) {
  if (!belief) return null;

  function scoreColor(score) {
    if (score === null) return 'var(--howl-mute)';
    if (score >= 70) return 'var(--howl-strong)';
    if (score >= 40) return 'var(--howl-mid)';
    return 'var(--howl-weak)';
  }

  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="font-display" style={{ fontSize: '2rem', lineHeight: 1.05 }}>
          The Belief Read.
        </h2>
        <p
          className="text-base mt-2"
          style={{ color: 'var(--howl-ink-soft)', fontStyle: 'italic' }}
        >
          How consumers and audiences judge your sustainability, impact, and intent.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-6">
        {BELIEF_DIMENSIONS.map((d) => {
          const data = belief[d.id];
          if (!data) return null;
          return (
            <div key={d.id} className="card-howl p-6 flex flex-col">
              <div className="flex items-baseline justify-between mb-2">
                <div className="font-display" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                  {d.name}
                </div>
                <div
                  className="font-display tabular-nums"
                  style={{
                    fontSize: '2.5rem',
                    lineHeight: 1,
                    color: scoreColor(data.score),
                  }}
                >
                  {data.score ?? '–'}
                </div>
              </div>
              <p
                className="text-xs mb-4"
                style={{ color: 'var(--howl-mute)', fontStyle: 'italic' }}
              >
                {d.question}
              </p>
              {data.read && (
                <p
                  className="text-sm"
                  style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.55 }}
                >
                  {data.read}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {belief.summary && (
        <div
          className="p-6"
          style={{
            background: 'var(--howl-bone)',
            border: '1.5px solid var(--howl-ink)',
            borderLeftWidth: '4px',
            borderLeftColor: 'var(--howl-coral)',
          }}
        >
          <p className="text-lg leading-snug" style={{ fontStyle: 'italic' }}>
            "{belief.summary}"
          </p>
        </div>
      )}
    </div>
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
              <div className="flex gap-1 flex-wrap shrink-0 max-w-[45%] justify-end">
                {r._reference && (
                  <span
                    className="tag-howl"
                    style={{
                      fontSize: '0.625rem',
                      background: 'transparent',
                      color: 'var(--howl-mute)',
                      border: '1px dashed var(--howl-mute)',
                    }}
                    title="Reference play from the HOWL library, surfaced because the AI did not return brand-specific recommendations for this signal."
                  >
                    Reference
                  </span>
                )}
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
// PROMPT BUILDERS, brand-agnostic, surface-aware
// ============================================================================

function buildSystemPrompt() {
  const signalSpec = SIGNALS.map(
    (s) =>
      `### ${s.id}, ${s.name}\n` +
      `Question: ${s.question}\n` +
      `Thesis: ${s.thesis}\n` +
      `Strong: ${s.strong.join('; ')}\n` +
      `Moderate: ${s.moderate.join('; ')}\n` +
      `Weak: ${s.weak.join('; ')}\n`
  ).join('\n');

  const surfaceSpec = SURFACES.map(
    (s) =>
      `### ${s.id}, ${s.name}\n` +
      `Covers: ${s.description}\n` +
      `Look for: ${s.looks_for.join('; ')}\n`
  ).join('\n');

  const beliefSpec = BELIEF_DIMENSIONS.map(
    (d) =>
      `### ${d.id}, ${d.name}\n` +
      `Question: ${d.question}\n` +
      `Thesis: ${d.thesis}\n` +
      `Strong: ${d.strong.join('; ')}\n` +
      `Weak: ${d.weak.join('; ')}\n`
  ).join('\n');

  return `You are the analytical engine behind HOWL READ, a brand diagnostic from HOWL, a creative agency born inside Antenna Group.

HOWL's thesis applies to any brand, not only sustainability or impact brands:
- Everyone is shouting at the same volume, at the same frequency, at the same time. The truth stands out. Real doesn't compete; it commands.
- Consequential brands do not communicate values, they embody them. Distinctiveness is identity, not message.
- Show scars AND vision. Round-numbered aspiration without methodology is a red flag, not a green one.
- Marketing works when it connects to identity, not duty. Benefit. Authenticity. Desire. Momentum.
- The job is to move brands from performative to meaningful, from safe to believed.

You speak in HOWL's voice: direct, sharp, observational, anti-corporate. No hedged consultant language. No "journey" clichés. No "leveraging", "ecosystem", "stakeholders", unless mocking them. You name what you see. You do not lecture.

PUNCTUATION RULE: Never use em-dashes (—) or en-dashes (–) in any output text. They are banned. Use periods, commas, colons, or parentheses instead. Two short sentences beat one with an em-dash. This rule applies to every "read", "rationale", "summary", "verdict", and any other text field in the JSON.

You score brands across SIX SIGNALS (each 0-100):

${signalSpec}

You evaluate each signal across FOUR EVIDENCE SURFACES (each 0-100):

${surfaceSpec}

You ALSO score the brand on THREE BELIEF DIMENSIONS (each 0-100). This is reception, not expression: how consumers and audiences judge the brand's sustainability, social impact, and positive impact on the world. Trust, evidence, and the invitation to participate. Every brand gets scored here, including brands without an explicit impact platform, because audiences in 2026 judge every brand on impact posture whether the brand chooses to talk about it or not.

${beliefSpec}

For belief scoring, focus on what AUDIENCES say and how the brand is RECEIVED, not what the brand claims. Use these signals:
- Reddit, Trustpilot, Glassdoor, App Store reviews: are claims questioned, defended, or ignored?
- AI engine descriptions: are claims described matter-of-factly or hedged?
- Tier-one earned coverage: do journalists treat impact claims as fact or as PR?
- Brand's own website: is there a take-back program, repair service, community space, advocacy channel? Are consumers given a role?
- Certifications, audits, third-party ratings: visible, accessible, or buried?

Use web_search aggressively before scoring. For each brand you read:
1. Fetch the homepage and About page.
2. Search for the brand's recent social posts on LinkedIn, Instagram, X, TikTok, YouTube.
3. Search for what the brand is reviewed for on Trustpilot, Glassdoor, Reddit, App stores.
4. Search for tier-one earned media coverage from the last 12 months.
5. Search for greenwashing or credibility commentary about the brand on Reddit and in earned media.
6. Note how publicly accessible AI information describes the brand.

You ALWAYS produce specific evidence rooted in what the brand actually does on its public surfaces. You name pages, campaigns, partners, language patterns, headlines. No generic statements like "their website discusses sustainability".

Return STRICT JSON only. No prose outside the JSON. No code fences. The schema is:

{
  "verdict": "1-2 sentence pull-quote in HOWL voice naming the brand's current stance",
  "summary": "3-4 sentence read of where the brand stands overall, sharp, specific, no hedging",
  "signals": {
    "VOLUME":      { "score": <int 0-100, average of by_surface>, "read": "2-3 sentences in HOWL voice", "by_surface": {"WEBSITE": <int>, "SOCIAL": <int>, "REPUTATION": <int>, "EARNED": <int>}, "evidence": ["specific observation", "specific observation", "specific observation"] },
    "INTEGRATION": { ... },
    "IDENTITY":    { ... },
    "CANDOR":      { ... },
    "DESIRE":      { ... },
    "MOMENTUM":    { ... }
  },
  "belief": {
    "TRUSTED":       { "score": <int 0-100>, "read": "2-3 sentences in HOWL voice on what audiences actually say and how the brand is received on trust" },
    "PROVEN":        { "score": <int 0-100>, "read": "2-3 sentences in HOWL voice on whether evidence exists and whether audiences can find it" },
    "PARTICIPATORY": { "score": <int 0-100>, "read": "2-3 sentences in HOWL voice on whether consumers have a role or just an audience seat" },
    "summary": "3-4 sentences in HOWL voice on the overall audience verdict. Whether the brand has built trust faster than it has built evidence. Whether the impact story is a shared project or a marketing claim."
  },
  "edge": [
    { "title": "Short verb-led name", "rationale": "1-2 sentences in HOWL voice. Why this strategic move, why for THIS brand, naming specific evidence", "addresses": ["SIGNAL_ID"] },
    { "title": "...", "rationale": "...", "addresses": ["SIGNAL_ID"] },
    { "title": "...", "rationale": "...", "addresses": ["SIGNAL_ID", "SIGNAL_ID"] }
  ],
  "play": [
    { "title": "Short verb-led name", "rationale": "1-2 sentences in HOWL voice. The creative provocation and why it's earnable for THIS brand", "addresses": ["SIGNAL_ID"] },
    { "title": "...", "rationale": "...", "addresses": ["SIGNAL_ID"] },
    { "title": "...", "rationale": "...", "addresses": ["SIGNAL_ID"] }
  ]
}

Scoring rules:
- The "score" for each signal MUST equal the rounded average of its four by_surface scores. The client will verify and recompute this if inconsistent.
- Score honestly. Most brands fall in 30-65 range. Reserve 70+ for genuinely strong signals with real evidence. 85+ should be rare.
- Surface scores can diverge meaningfully within a single signal, e.g., VOLUME may be 75 on WEBSITE but 35 on EARNED. Surface that pattern in the "read".
- Evidence MUST be specific. Name the page, the campaign, the partner, the language pattern.
- Voice: HOWL. Short sentences.
- MANDATORY: Always return EXACTLY 3 items in the "edge" array and EXACTLY 3 items in the "play" array. Never return empty arrays. Never return fewer than 3. This applies to every brand regardless of overall score. If no signal is weak, target the 3 LOWEST-scoring signals to push them from Speaking to Howling.
- Each recommendation must be BRAND-SPECIFIC. Reference the brand's actual evidence (a page, a campaign, a language tic, a missing surface presence) in the rationale. No generic agency boilerplate. No advice that could apply to any brand in the category.
- EDGE recommendations are strategic. PLAY recommendations are creative provocations.
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
  if (socials) lines.push(`\nAuto-discovered social handles (verified via web search at READ time, focus the SOCIAL surface evaluation on these):\n${socials}`);
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

// Strip em-dashes and en-dashes from every string in the parsed JSON.
// Safety net: even with a "no em-dashes" rule in the system prompt, the model
// occasionally slips. This walks the response recursively and replaces them
// with context-aware punctuation before the data reaches the UI.
function stripDashes(value) {
  if (typeof value === 'string') {
    return value
      .replace(/ [—–] ([A-Z])/g, '. $1')   // " — Capital" → ". Capital"
      .replace(/ [—–] (\d)/g, ': $1')       // " — 42" → ": 42"
      .replace(/ [—–] /g, ', ')             // " — anything else" → ", anything else"
      .replace(/[—–]/g, '-');               // bare leftover → simple hyphen
  }
  if (Array.isArray(value)) {
    return value.map(stripDashes);
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) {
      out[k] = stripDashes(value[k]);
    }
    return out;
  }
  return value;
}

// Walks the text forward tracking brace depth (respecting strings and escapes)
// and returns every top-level {...} substring it finds. Robust against Claude
// emitting prose after the JSON, intermediate tool-use chatter, or multiple
// candidate objects in a single response.
function findJsonObjects(s) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        objects.push(s.slice(start, i + 1));
        start = -1;
      } else if (depth < 0) {
        // Stray closing brace, reset and continue
        depth = 0;
        start = -1;
      }
    }
  }
  return objects;
}

function extractJson(text) {
  if (!text) throw new Error('Empty response from Claude.');
  let s = text.trim();
  // Strip surrounding code fences if Claude wrapped the response
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');

  const candidates = findJsonObjects(s);
  if (candidates.length === 0) {
    throw new Error('No JSON object found in response.');
  }

  // Prefer candidates that match the expected READ schema (have "signals" or
  // a recognised social handle key). Otherwise fall back to the last parseable
  // object, which is almost always the actual answer when there's any.
  let bestKnown = null;
  let lastParsed = null;
  for (let i = candidates.length - 1; i >= 0; i--) {
    let parsed;
    try {
      parsed = JSON.parse(candidates[i]);
    } catch {
      continue;
    }
    if (parsed && typeof parsed === 'object') {
      if (lastParsed === null) lastParsed = parsed;
      if ('signals' in parsed || 'linkedin' in parsed || 'instagram' in parsed) {
        bestKnown = parsed;
        break;
      }
    }
  }
  if (bestKnown) return bestKnown;
  if (lastParsed) return lastParsed;
  throw new Error('Found JSON-like content but could not parse it.');
}

function zeroSurfaces() {
  const o = {};
  SURFACE_IDS.forEach((id) => { o[id] = 0; });
  return o;
}

// Pull 3 reference recommendations from the static playbook for the weakest signals.
// Used as a safety net when Claude returns empty edge/play arrays.
function fallbackRecommendations(signals, playbook) {
  // Sort signal IDs by score ascending, take the 3 weakest
  const ranked = SIGNALS
    .map((sig) => ({ id: sig.id, score: signals[sig.id]?.score ?? 0 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return ranked
    .map(({ id }) => {
      const plays = playbook[id] || [];
      const play = plays[0];
      if (!play) return null;
      return {
        title: play.title,
        rationale: play.description,
        addresses: [id],
        _reference: true,
      };
    })
    .filter(Boolean);
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

  let edge = Array.isArray(raw.edge) ? raw.edge.slice(0, 4) : [];
  let play = Array.isArray(raw.play) ? raw.play.slice(0, 4) : [];

  // Safety net: never show an empty EDGE or PLAY section. Pull reference plays
  // from the static playbook keyed on the weakest signals.
  if (edge.length === 0) edge = fallbackRecommendations(signals, EDGE_PLAYBOOK);
  if (play.length === 0) play = fallbackRecommendations(signals, PLAY_PLAYBOOK);

  // Belief: audience reception of sustainability, impact, and intent.
  // Each dimension scored 0-100. Read paragraphs in HOWL voice. Optional
  // summary across all three dimensions.
  const belief = { summary: '' };
  let hasBeliefData = false;
  BELIEF_IDS.forEach((id) => {
    const d = raw.belief?.[id];
    if (d && typeof d === 'object') {
      const s = typeof d.score === 'number' ? Math.max(0, Math.min(100, Math.round(d.score))) : null;
      belief[id] = { score: s, read: d.read || '' };
      if (s !== null) hasBeliefData = true;
    } else {
      belief[id] = { score: null, read: '' };
    }
  });
  if (typeof raw.belief?.summary === 'string') belief.summary = raw.belief.summary;

  return {
    overall_score: overall,
    verdict: raw.verdict || '',
    summary: raw.summary || '',
    signals,
    belief: hasBeliefData ? belief : null,
    edge,
    play,
  };
}

// ============================================================================
// AI REPRESENTATION SAMPLE
// Quick unprompted Claude call (no web search) to capture how the model
// describes the brand from training data alone. Feeds the REPUTATION read.
// ============================================================================

async function fetchAiDescription(brandName, websiteUrl) {
  const prompt = `What is "${brandName}" (${websiteUrl})? Give a concise, factual 3-5 sentence description as if responding to a user asking you about this brand. Cover what they do, who their audience is, and what they're known for.

If you do not have reliable information about this brand, say so explicitly, e.g. "I don't have reliable information about [BRAND]." Do not invent or guess. Do not search the web. Respond based only on what you know.`;

  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...passwordHeaders(),
      },
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
    return ''; // graceful degrade, main READ continues without it
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
      headers: {
        'Content-Type': 'application/json',
        ...passwordHeaders(),
      },
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
      // Steps 1 and 2 run in parallel since they're independent.
      // AI description does not need handles. Handle discovery does not need
      // the description. Running them concurrently shaves 15-25 seconds off
      // the total wall-clock time.
      setStage('discovery');
      const [aiDescription, socialHandles] = await Promise.all([
        fetchAiDescription(meta.brandName, meta.websiteUrl),
        fetchSocialHandles(meta.brandName, meta.websiteUrl),
      ]);
      const socialsStr = formatSocialsForPrompt(socialHandles);

      // Step 3, main READ with everything injected.
      setStage('main');
      const enrichedMeta = {
        ...meta,
        aiSummary: aiDescription,
        socials: socialsStr,
      };

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...passwordHeaders(),
        },
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

      if (res.status === 401) {
        clearPassword();
        throw new Error('Session expired. Refresh the page and sign in again.');
      }
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

      const raw = stripDashes(extractJson(text));
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

      // Persist to Supabase in the background. Don't block the report on it.
      saveRead(meta, normalized).catch((e) => console.error('saveRead failed:', e));

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

  // Load a saved read from Supabase (no re-run, just display the stored result).
  async function loadFromHistory(row) {
    if (!row?.id) return;
    setError('');
    setView('running');
    setStage('main');
    setBrandMeta(row.brand_meta || { brandName: row.brand_name });
    const full = await fetchReadById(row.id);
    if (!full || !full.report) {
      setError('Could not load that saved READ.');
      setView('error');
      setStage(null);
      return;
    }
    setBrandMeta(full.brand_meta);
    setReport(full.report);
    setView('report');
    setStage(null);
  }

  // Re-run a READ using a previous read's brand inputs.
  function rerunFromHistory(row) {
    if (!row?.brand_meta) return;
    runRead(row.brand_meta);
  }

  function signOut() {
    clearPassword();
    window.location.reload();
  }

  return (
    <PasswordGate>
      <Header onReset={reset} showReset={view !== 'intake'} onSignOut={signOut} />
      {view === 'intake' && (
        <>
          <IntakeForm onSubmit={runRead} disabled={submitting} />
          <div className="mx-auto max-w-6xl px-6 pb-16">
            <PreviousReads onLoad={loadFromHistory} onRerun={rerunFromHistory} />
          </div>
        </>
      )}
      {view === 'running' && (
        <RunningRead brandName={brandMeta?.brandName || ''} stage={stage} />
      )}
      {view === 'report' && report && brandMeta && (
        <ReadReport report={report} onReset={reset} brandMeta={brandMeta} />
      )}
      {view === 'error' && <ErrorScreen error={error} onBack={reset} />}
      <BuildBadge />
    </PasswordGate>
  );
}
