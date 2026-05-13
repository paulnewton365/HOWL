import { useState, useEffect, useMemo, useRef } from 'react';
import { track } from '@vercel/analytics';
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
import {
  getPassword,
  setPassword,
  clearPassword,
  hasPassword,
  hasEmail,
  getUserEmail,
  setUserEmail,
  isAdmin,
  adminEmailDisplay,
  passwordHeaders,
} from './lib/auth';
import {
  saveRead,
  fetchRecentReads,
  fetchReadById,
  fetchReadsForQuadrant,
  findExistingRead,
  deleteRead,
  updateReadCategory,
  supabaseEnabled,
  supabaseStatus,
  supabaseDebug,
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
  Search,
  X,
  Share2,
  Link as LinkIcon,
  Grid2X2,
  Pencil,
} from 'lucide-react';

// Build-time version metadata, injected by vite.config.js. Baked into the
// bundle at build time so the badge reflects this specific deployment.
const APP_VERSION = `v${typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0'} · ${typeof __BUILD_DATE__ === 'string' ? __BUILD_DATE__ : ''}${typeof __BUILD_SHA__ === 'string' && __BUILD_SHA__ !== 'local' ? ` · ${__BUILD_SHA__}` : ''}`;

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
  const sessionComplete = () => hasPassword() && hasEmail();

  const [authed, setAuthed] = useState(sessionComplete);
  const [verifying, setVerifying] = useState(sessionComplete);
  const [emailInput, setEmailInput] = useState('');
  const [pwdInput, setPwdInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  // On mount, validate the cached session against the server. Sessions from
  // before admin support exist (password set, email missing) get bounced
  // cleanly to the new login screen with a helpful message.
  useEffect(() => {
    if (hasPassword() && !hasEmail()) {
      clearPassword();
      setAuthed(false);
      setError('We added email-based admin permissions. Sign in again with your email and the team password.');
      setVerifying(false);
      return;
    }
    if (!sessionComplete()) {
      setVerifying(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/check-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: getPassword(), email: getUserEmail() }),
        });
        if (cancelled) return;
        if (res.status === 401) {
          clearPassword();
          setAuthed(false);
          setError('Your session expired. Sign in again.');
        }
      } catch {
        // Network glitch. Let the user proceed; the next API call will surface
        // the issue with the proper error UI.
      } finally {
        if (!cancelled) setVerifying(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const email = emailInput.trim().toLowerCase();
    const pwd = pwdInput.trim();
    if (!email || !pwd) {
      setError('Email and password are both required.');
      return;
    }
    if (!/.+@.+\..+/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setChecking(true);
    try {
      const res = await fetch('/api/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd, email }),
      });
      if (res.ok) {
        setPassword(pwd);
        setUserEmail(email);
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

  if (authed && !verifying) return children;

  // Brief loading state while we re-validate the cached password on mount.
  if (authed && verifying) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--howl-mute)' }}>
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Checking your session.</span>
        </div>
      </div>
    );
  }

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
          The Read is a HOWL tool. Sign in with your work email and the team password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-howl" htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="input-howl"
              disabled={checking}
              placeholder="you@antennagroup.com"
            />
          </div>

          <div>
            <label className="label-howl" htmlFor="pwd">Password</label>
            <input
              id="pwd"
              type="password"
              autoComplete="current-password"
              value={pwdInput}
              onChange={(e) => setPwdInput(e.target.value)}
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

function HistoryView({ onLoad, onRerun, onReset }) {
  // Color the score number by tier, so on mobile (where we hide the verdict
  // pill) the color alone tells you Whispering / Speaking / Howling.
  function scoreColorFor(score) {
    if (score >= 70) return 'var(--howl-strong)';
    if (score >= 40) return 'var(--howl-mid)';
    return 'var(--howl-weak)';
  }
  const [reads, setReads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [savedCategoryFlash, setSavedCategoryFlash] = useState(null);

  // Filter + sort state
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState('date-desc');

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false);
      if (supabaseStatus === 'wrong-key-type') setError({ reason: 'wrong-key-type' });
      else if (supabaseStatus === 'invalid-key') setError({ reason: 'invalid-key' });
      return;
    }
    fetchRecentReads(200).then((result) => {
      if (!result.ok) {
        setError({ reason: result.reason, message: result.message });
      } else {
        setReads(result.data);
      }
      setLoading(false);
    });
  }, []);

  async function handleDelete(id) {
    setBusyId(id);
    setDeleteError('');
    const result = await deleteRead(id);
    if (result.ok) {
      setReads((rs) => rs.filter((r) => r.id !== id));
    } else if (result.reason === 'forbidden') {
      setDeleteError('Only the admin can delete reads.');
    } else if (result.reason === 'unauthorized') {
      setDeleteError('Your session expired. Sign in again to delete.');
    } else {
      setDeleteError(result.message || 'Delete failed.');
    }
    setBusyId(null);
  }

  // Apply filters client-side. Fast for the small numbers we'll have.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = reads.filter((r) => {
      if (q && !r.brand_name.toLowerCase().includes(q)) return false;
      if (verdictFilter && r.verdict !== verdictFilter) return false;
      if (categoryFilter && r.category !== categoryFilter) return false;
      return true;
    });
    switch (sort) {
      case 'date-asc':
        out = [...out].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'score-desc':
        out = [...out].sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0));
        break;
      case 'score-asc':
        out = [...out].sort((a, b) => (a.overall_score ?? 0) - (b.overall_score ?? 0));
        break;
      case 'brand-asc':
        out = [...out].sort((a, b) => a.brand_name.localeCompare(b.brand_name));
        break;
      default: // 'date-desc'
        out = [...out].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return out;
  }, [reads, search, verdictFilter, categoryFilter, sort]);

  const anyFilterActive = !!(search || verdictFilter || categoryFilter);

  function clearFilters() {
    setSearch('');
    setVerdictFilter('');
    setCategoryFilter('');
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 howl-fadein">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="howl-stamp" style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}>
            The archive
          </div>
          {isAdmin() && (
            <span
              className="howl-stamp"
              style={{
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                color: 'var(--howl-cream)',
                background: 'var(--howl-ink)',
                padding: '2px 8px',
              }}
            >
              ADMIN
            </span>
          )}
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1 }}>
            Previous Reads.
          </h1>
          <button onClick={onReset} className="btn-howl">
            <RefreshCw size={14} />
            Run a new READ
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          className="card-howl p-5 flex items-center gap-3"
          style={{ color: 'var(--howl-mute)' }}
        >
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading your history.</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          className="card-howl p-5 mb-6"
          style={{ borderColor: 'var(--howl-weak)', background: 'rgba(183, 53, 37, 0.04)' }}
        >
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--howl-weak)' }} />
            <div className="howl-stamp" style={{ fontSize: '0.875rem', color: 'var(--howl-weak)' }}>
              Could not load history
            </div>
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.5 }}>
            {supabaseConnectionHelp(error.reason)}
          </p>
          {error.message && (
            <p className="text-xs font-mono" style={{ color: 'var(--howl-mute)' }}>
              {error.message}
            </p>
          )}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && reads.length === 0 && (
        <div className="card-howl p-5 sm:p-7" style={{ background: 'var(--howl-bone)' }}>
          <p className="text-base mb-2" style={{ color: 'var(--howl-ink-soft)' }}>
            No reads recorded yet.
          </p>
          <p className="text-sm" style={{ color: 'var(--howl-mute)' }}>
            Click <strong>Run a new READ</strong> above to start. Saved reads appear here so you can
            revisit, re-run, or compare them later.
          </p>
        </div>
      )}

      {/* Filter bar + list */}
      {!loading && !error && reads.length > 0 && (
        <>
          <div
            className="card-howl p-4 mb-5"
            style={{ background: 'var(--howl-bone)' }}
          >
            <div className="grid md:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="md:col-span-5 relative">
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--howl-mute)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by brand"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-howl"
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              {/* Verdict filter */}
              <div className="md:col-span-2">
                <select
                  value={verdictFilter}
                  onChange={(e) => setVerdictFilter(e.target.value)}
                  className="input-howl"
                >
                  <option value="">All verdicts</option>
                  {VERDICT_TIERS.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Category filter */}
              <div className="md:col-span-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input-howl"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="md:col-span-2">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="input-howl"
                >
                  <option value="date-desc">Newest</option>
                  <option value="date-asc">Oldest</option>
                  <option value="score-desc">Highest score</option>
                  <option value="score-asc">Lowest score</option>
                  <option value="brand-asc">Brand A→Z</option>
                </select>
              </div>
            </div>

            {anyFilterActive && (
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--howl-cream-deep)' }}>
                <span className="text-xs" style={{ color: 'var(--howl-mute)' }}>
                  Showing {filtered.length} of {reads.length}
                </span>
                <button
                  onClick={clearFilters}
                  className="btn-ghost"
                  style={{ padding: '4px 10px', fontSize: '0.6875rem' }}
                >
                  <X size={12} />
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {deleteError && (
            <div
              className="card-howl p-3 mb-3 flex items-start gap-2"
              style={{ borderColor: 'var(--howl-weak)', background: 'rgba(183, 53, 37, 0.04)' }}
            >
              <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--howl-weak)' }} />
              <span className="text-sm" style={{ color: 'var(--howl-ink-soft)' }}>{deleteError}</span>
              <button
                onClick={() => setDeleteError('')}
                className="ml-auto shrink-0"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--howl-mute)' }}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="card-howl p-5 sm:p-7 text-center" style={{ background: 'var(--howl-bone)' }}>
              <p className="text-sm" style={{ color: 'var(--howl-ink-soft)' }}>
                No reads match those filters.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => {
                const date = new Date(r.created_at);
                const dateStr = date.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                const category = CATEGORIES.find((c) => c.id === r.category)?.name;
                const isEditing = editingCategoryId === r.id;
                return (
                  <div
                    key={r.id}
                    className="card-howl flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-[var(--howl-bone)] transition-colors"
                    style={{ cursor: isEditing ? 'default' : 'pointer' }}
                    onClick={() => { if (!isEditing) onLoad(r); }}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-display truncate"
                        style={{ fontSize: '1.0625rem', lineHeight: 1.1 }}
                      >
                        {r.brand_name}
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                          <span
                            className="text-[11px] tracking-wide uppercase shrink-0"
                            style={{ color: 'var(--howl-mute)' }}
                          >
                            {dateStr} ·
                          </span>
                          <select
                            value={r.category || ''}
                            onChange={async (e) => {
                              const newCat = e.target.value;
                              if (!newCat || newCat === r.category) {
                                setEditingCategoryId(null);
                                return;
                              }
                              const result = await updateReadCategory(r.id, newCat);
                              if (result.ok) {
                                setReads((prev) =>
                                  prev.map((row) =>
                                    row.id === r.id ? { ...row, category: newCat } : row
                                  )
                                );
                                setSavedCategoryFlash(r.id);
                                setTimeout(() => setSavedCategoryFlash(null), 1400);
                              } else {
                                setDeleteError(result.message || 'Could not update category.');
                              }
                              setEditingCategoryId(null);
                            }}
                            onBlur={() => setEditingCategoryId(null)}
                            autoFocus
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              border: '1px solid var(--howl-ink)',
                              background: 'var(--howl-cream)',
                              fontFamily: 'Inter, sans-serif',
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                            }}
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div
                          className="text-[11px] tracking-wide uppercase mt-1 truncate flex items-center gap-2"
                          style={{ color: 'var(--howl-mute)' }}
                        >
                          <span className="truncate">
                            {dateStr}{category ? ` · ${category}` : ''}
                          </span>
                          {savedCategoryFlash === r.id && (
                            <span
                              className="shrink-0"
                              style={{ color: 'var(--howl-strong)', fontWeight: 600 }}
                            >
                              ✓ saved
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className="font-display tabular-nums shrink-0"
                      style={{ fontSize: '1.625rem', lineHeight: 1, color: scoreColorFor(r.overall_score) }}
                    >
                      {r.overall_score}
                    </div>
                    <div className="shrink-0 hide-on-mobile">
                      <VerdictStamp score={r.overall_score} />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategoryId(isEditing ? null : r.id);
                      }}
                      className="shrink-0"
                      title={isEditing ? 'Cancel' : 'Edit category'}
                      style={{
                        padding: '6px 8px',
                        color: isEditing ? 'var(--howl-coral)' : 'var(--howl-mute)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={14} />
                    </button>
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
                    {isAdmin() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }}
                        disabled={busyId === r.id}
                        title="Delete (admin only)"
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}

// ============================================================================
// QUADRANT VIEW — plots all saved reads on a 2D Signals vs Belief chart.
// Each dot is a saved read, colored by category. Hover reveals brand details;
// click loads that read. Category-toggle pills let you isolate slices.
// ============================================================================

function QuadrantView({ onLoad, onReset }) {
  const [reads, setReads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);

  // Set of category ids that are currently visible. Start with all on.
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(CATEGORIES.map((c) => c.id))
  );

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false);
      if (supabaseStatus === 'wrong-key-type') setError({ reason: 'wrong-key-type' });
      else if (supabaseStatus === 'invalid-key') setError({ reason: 'invalid-key' });
      return;
    }
    fetchReadsForQuadrant(500).then((result) => {
      if (!result.ok) {
        setError({ reason: result.reason, message: result.message });
      } else {
        setReads(result.data);
      }
      setLoading(false);
    });
  }, []);

  // Only show reads that have BOTH overall_score and a belief_avg.
  const plottable = useMemo(
    () =>
      reads.filter(
        (r) =>
          typeof r.overall_score === 'number' &&
          typeof r.belief_avg === 'number' &&
          activeCategories.has(r.category)
      ),
    [reads, activeCategories]
  );

  const totalWithBoth = useMemo(
    () =>
      reads.filter(
        (r) => typeof r.overall_score === 'number' && typeof r.belief_avg === 'number'
      ).length,
    [reads]
  );

  const missingBelief = reads.length - totalWithBoth;

  function toggleCategory(id) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function showAllCategories() {
    setActiveCategories(new Set(CATEGORIES.map((c) => c.id)));
  }
  function hideAllCategories() {
    setActiveCategories(new Set());
  }
  function categoryColor(id) {
    return CATEGORIES.find((c) => c.id === id)?.color || 'var(--howl-mute)';
  }

  // SVG plot geometry. The viewBox is fixed; CSS scales it responsively.
  const VB_W = 760;
  const VB_H = 560;
  const PAD_L = 60;
  const PAD_R = 40;
  const PAD_T = 50;
  const PAD_B = 60;
  const plotX0 = PAD_L;
  const plotX1 = VB_W - PAD_R;
  const plotY0 = PAD_T;
  const plotY1 = VB_H - PAD_B;
  const plotW = plotX1 - plotX0;
  const plotH = plotY1 - plotY0;
  const midX = plotX0 + plotW / 2;
  const midY = plotY0 + plotH / 2;

  function toX(score) {
    return plotX0 + (score / 100) * plotW;
  }
  function toY(belief) {
    return plotY1 - (belief / 100) * plotH;
  }

  // Sort: hovered dot rendered last (on top). Otherwise newest on top.
  const sortedForRender = useMemo(() => {
    const arr = [...plottable];
    arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return arr;
  }, [plottable]);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 howl-fadein">
      {/* Page header */}
      <div className="mb-6">
        <div className="howl-stamp mb-2" style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}>
          The Quadrant
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1 }}>
            Volume vs Belief.
          </h1>
          <button onClick={onReset} className="btn-howl">
            <RefreshCw size={14} />
            Run a new READ
          </button>
        </div>
        <p className="text-sm mt-3" style={{ color: 'var(--howl-ink-soft)', maxWidth: '60ch' }}>
          Every saved Read plotted by its signal volume (how loudly it carries its story) and audience belief (how well the story lands). Hover any dot to see the brand. Click to open the Read.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div
          className="card-howl p-5 flex items-center gap-3"
          style={{ color: 'var(--howl-mute)' }}
        >
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading the archive.</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          className="card-howl p-5 mb-6"
          style={{ borderColor: 'var(--howl-weak)', background: 'rgba(183, 53, 37, 0.04)' }}
        >
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--howl-weak)' }} />
            <div className="howl-stamp" style={{ fontSize: '0.875rem', color: 'var(--howl-weak)' }}>
              Could not load history
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.5 }}>
            {supabaseConnectionHelp(error.reason)}
          </p>
          {error.message && (
            <p className="text-xs font-mono mt-2" style={{ color: 'var(--howl-mute)' }}>
              {error.message}
            </p>
          )}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && totalWithBoth === 0 && (
        <div className="card-howl p-7" style={{ background: 'var(--howl-bone)' }}>
          <p className="text-base mb-2" style={{ color: 'var(--howl-ink-soft)' }}>
            No reads in the archive yet.
          </p>
          <p className="text-sm" style={{ color: 'var(--howl-mute)' }}>
            Run a few Reads. They will appear here, plotted by their volume and credibility scores.
          </p>
        </div>
      )}

      {/* The chart + filter */}
      {!loading && !error && totalWithBoth > 0 && (
        <>
          {/* Category filter pills */}
          <div
            className="card-howl p-4 mb-5"
            style={{ background: 'var(--howl-bone)' }}
          >
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div
                className="howl-stamp"
                style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--howl-mute)' }}
              >
                Show categories
              </div>
              <div className="flex gap-2">
                <button
                  onClick={showAllCategories}
                  className="btn-ghost"
                  style={{ padding: '4px 10px', fontSize: '0.6875rem' }}
                >
                  Show all
                </button>
                <button
                  onClick={hideAllCategories}
                  className="btn-ghost"
                  style={{ padding: '4px 10px', fontSize: '0.6875rem' }}
                >
                  Hide all
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = activeCategories.has(c.id);
                const count = reads.filter(
                  (r) => r.category === c.id && typeof r.belief_avg === 'number'
                ).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    title={`${c.name} (${count})`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontFamily: 'Anton, Inter, sans-serif',
                      cursor: 'pointer',
                      background: active ? c.color : 'transparent',
                      color: active ? '#fff' : 'var(--howl-ink-soft)',
                      border: `1.5px solid ${active ? c.color : 'var(--howl-cream-deep)'}`,
                      opacity: count === 0 ? 0.4 : 1,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        background: c.color,
                        border: active ? '1px solid #fff' : 'none',
                      }}
                    />
                    {c.name}
                    <span style={{ opacity: 0.7 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plot summary */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <p className="text-xs" style={{ color: 'var(--howl-mute)' }}>
              Plotting {plottable.length} of {totalWithBoth} reads with belief data
              {missingBelief > 0 ? ` · ${missingBelief} read${missingBelief === 1 ? '' : 's'} without belief data hidden` : ''}
            </p>
          </div>

          {/* The Quadrant chart */}
          <div
            className="card-howl"
            style={{ background: 'var(--howl-bone)', padding: '12px sm:24px', overflow: 'hidden' }}
          >
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              width="100%"
              style={{ display: 'block', height: 'auto' }}
              aria-label="Quadrant chart: signals score on X-axis, belief score on Y-axis"
            >
              {/* Quadrant background tints */}
              <rect x={plotX0} y={plotY0} width={plotW / 2} height={plotH / 2}
                    fill="var(--howl-cream)" fillOpacity={0.4} />
              <rect x={midX} y={plotY0} width={plotW / 2} height={plotH / 2}
                    fill="var(--howl-cream)" fillOpacity={0.6} />
              <rect x={plotX0} y={midY} width={plotW / 2} height={plotH / 2}
                    fill="var(--howl-cream)" fillOpacity={0.6} />
              <rect x={midX} y={midY} width={plotW / 2} height={plotH / 2}
                    fill="var(--howl-cream)" fillOpacity={0.4} />

              {/* Gridlines at 25/75 */}
              {[25, 75].map((v) => (
                <g key={`gx${v}`}>
                  <line
                    x1={toX(v)} y1={plotY0} x2={toX(v)} y2={plotY1}
                    stroke="var(--howl-ink)" strokeOpacity={0.06} strokeDasharray="2 4"
                  />
                  <line
                    x1={plotX0} y1={toY(v)} x2={plotX1} y2={toY(v)}
                    stroke="var(--howl-ink)" strokeOpacity={0.06} strokeDasharray="2 4"
                  />
                </g>
              ))}

              {/* Mid-cross */}
              <line x1={midX} y1={plotY0} x2={midX} y2={plotY1}
                    stroke="var(--howl-ink)" strokeOpacity={0.25} strokeWidth={1} />
              <line x1={plotX0} y1={midY} x2={plotX1} y2={midY}
                    stroke="var(--howl-ink)" strokeOpacity={0.25} strokeWidth={1} />

              {/* Outer frame */}
              <rect x={plotX0} y={plotY0} width={plotW} height={plotH}
                    fill="none" stroke="var(--howl-ink)" strokeWidth={1.5} />

              {/* Axis labels */}
              <text
                x={(plotX0 + plotX1) / 2}
                y={plotY1 + 36}
                textAnchor="middle"
                style={{
                  fontFamily: 'Anton, Inter, sans-serif',
                  fontSize: 14,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fill: 'var(--howl-ink)',
                }}
              >
                Signals score →
              </text>
              <text
                x={-((plotY0 + plotY1) / 2)}
                y={20}
                transform="rotate(-90)"
                textAnchor="middle"
                style={{
                  fontFamily: 'Anton, Inter, sans-serif',
                  fontSize: 14,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fill: 'var(--howl-ink)',
                }}
              >
                Belief score →
              </text>

              {/* Tick labels */}
              {[0, 50, 100].map((v) => (
                <text
                  key={`tx${v}`}
                  x={toX(v)} y={plotY1 + 16}
                  textAnchor="middle"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fill: 'var(--howl-mute)' }}
                >
                  {v}
                </text>
              ))}
              {[0, 50, 100].map((v) => (
                <text
                  key={`ty${v}`}
                  x={plotX0 - 8} y={toY(v) + 3}
                  textAnchor="end"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fill: 'var(--howl-mute)' }}
                >
                  {v}
                </text>
              ))}

              {/* Quadrant strategic labels, set into the corners */}
              <text
                x={plotX0 + 10} y={plotY0 + 18}
                style={{
                  fontFamily: 'Anton, Inter, sans-serif',
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fill: 'var(--howl-ink)',
                  opacity: 0.35,
                }}
              >
                Underrated
              </text>
              <text
                x={plotX1 - 10} y={plotY0 + 18}
                textAnchor="end"
                style={{
                  fontFamily: 'Anton, Inter, sans-serif',
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fill: 'var(--howl-coral)',
                  opacity: 0.6,
                }}
              >
                Howling
              </text>
              <text
                x={plotX0 + 10} y={plotY1 - 10}
                style={{
                  fontFamily: 'Anton, Inter, sans-serif',
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fill: 'var(--howl-ink)',
                  opacity: 0.35,
                }}
              >
                Whispering
              </text>
              <text
                x={plotX1 - 10} y={plotY1 - 10}
                textAnchor="end"
                style={{
                  fontFamily: 'Anton, Inter, sans-serif',
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fill: 'var(--howl-weak)',
                  opacity: 0.6,
                }}
              >
                Shouting without trust
              </text>

              {/* Dots + always-on labels */}
              {sortedForRender.map((r) => {
                const x = toX(r.overall_score);
                const y = toY(r.belief_avg);
                const color = categoryColor(r.category);
                const isHovered = hovered?.id === r.id;
                return (
                  <g
                    key={r.id}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHovered(r)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => onLoad(r)}
                  >
                    {/* Larger invisible hit-target for hover and click */}
                    <circle cx={x} cy={y} r={10} fill="transparent" />
                    {/* The dot. Brand name is shown only on hover via the
                        foreignObject tooltip below, to keep the chart
                        readable as the archive grows. */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 3.5}
                      fill={color}
                      stroke="var(--howl-cream)"
                      strokeWidth={isHovered ? 2 : 1.25}
                    />
                  </g>
                );
              })}

              {/* Hover tooltip (HTML inside foreignObject for clean styling) */}
              {hovered && (() => {
                const x = toX(hovered.overall_score);
                const y = toY(hovered.belief_avg);
                const tipW = 150;
                const tipH = 46;
                // Position tooltip slightly above-right of dot, flip near edges
                const tipX = x + tipW + 14 > plotX1 ? x - tipW - 10 : x + 10;
                const tipY = y - tipH - 10 < plotY0 ? y + 10 : y - tipH - 10;
                const catName =
                  CATEGORIES.find((c) => c.id === hovered.category)?.name || hovered.category;
                return (
                  <foreignObject
                    x={tipX}
                    y={tipY}
                    width={tipW}
                    height={tipH}
                    style={{ pointerEvents: 'none', overflow: 'visible' }}
                  >
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        background: 'var(--howl-cream)',
                        border: '1.5px solid var(--howl-ink)',
                        padding: '5px 8px',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: 1.2,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'Anton, Inter, sans-serif',
                          fontSize: 11,
                          letterSpacing: '0.02em',
                          color: 'var(--howl-ink)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {hovered.brand_name}
                      </div>
                      <div
                        style={{
                          fontSize: 8,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--howl-mute)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {catName}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--howl-ink-soft)', marginTop: 1 }}>
                        S <strong style={{ color: 'var(--howl-ink)' }}>{hovered.overall_score}</strong>
                        {' · '}
                        B <strong style={{ color: 'var(--howl-ink)' }}>{hovered.belief_avg}</strong>
                      </div>
                    </div>
                  </foreignObject>
                );
              })()}
            </svg>
          </div>
        </>
      )}
    </main>
  );
}

function supabaseConnectionHelp(reason) {
  switch (reason) {
    case 'wrong-key-type':
      return 'You pasted the "service_role" (secret) key into VITE_SUPABASE_ANON_KEY. Supabase blocks secret keys in the browser as a safety feature. Go to Supabase Settings → API, copy the "anon" "public" key instead, replace the value on Vercel, and redeploy.';
    case 'invalid-key':
      return 'VITE_SUPABASE_ANON_KEY does not parse as a valid Supabase JWT. Double-check you copied the full key. It is a single long string starting with "eyJ" and contains exactly two periods.';
    case 'table-missing':
      return 'Supabase is reachable but the "reads" table does not exist. Run the SQL from supabase-schema.sql in your Supabase SQL Editor.';
    case 'rls-blocked':
      return 'Supabase blocked the request. The Row Level Security policies on the "reads" table need to permit anon read, insert, and delete. Re-run supabase-schema.sql.';
    case 'bad-credentials':
      return 'Supabase rejected the credentials. Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly on Vercel, then redeploy.';
    case 'network':
      return 'Could not reach Supabase. Check the Project URL is correct (no trailing slash) and the project is not paused.';
    default:
      return 'Something went wrong talking to Supabase. Check the browser console for details.';
  }
}

// ============================================================================
// DUPLICATE WARNING — shown when intake submits a brand that's already in
// the archive. User can view the existing read, override and run fresh
// anyway, or cancel back to the form.
// ============================================================================

function DuplicateWarning({ existing, onViewExisting, onProceed, onCancel }) {
  const verdict = getVerdict(existing.overall_score);
  const dateStr = new Date(existing.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const category = CATEGORIES.find((c) => c.id === existing.category)?.name;

  function scoreColor(score) {
    if (score >= 70) return 'var(--howl-strong)';
    if (score >= 40) return 'var(--howl-mid)';
    return 'var(--howl-weak)';
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-14 howl-fadein">
      <div
        className="card-howl p-5 sm:p-7"
        style={{ borderColor: 'var(--howl-coral)', borderLeftWidth: '4px' }}
      >
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--howl-coral)' }} />
          <div
            className="howl-stamp"
            style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}
          >
            Already in the archive
          </div>
        </div>

        <h1
          className="font-display mb-3"
          style={{ fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)', lineHeight: 1.05 }}
        >
          We've already read {existing.brand_name}.
        </h1>
        <p className="mb-6" style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.55 }}>
          Loading the existing Read is faster, avoids spending another API call, and keeps the
          archive tidy. You can still run a fresh one if something material has changed since
          {' '}{dateStr}.
        </p>

        {/* Summary card of the existing read */}
        <div
          className="card-howl flex items-center gap-3 p-3 sm:p-4 mb-6"
          style={{ background: 'var(--howl-bone)' }}
        >
          <div className="flex-1 min-w-0">
            <div
              className="font-display truncate"
              style={{ fontSize: '1.25rem', lineHeight: 1.1 }}
            >
              {existing.brand_name}
            </div>
            <div
              className="text-[11px] tracking-wide uppercase mt-1 truncate"
              style={{ color: 'var(--howl-mute)' }}
            >
              {dateStr}{category ? ` · ${category}` : ''}
            </div>
          </div>
          <div
            className="font-display tabular-nums shrink-0"
            style={{ fontSize: '2rem', lineHeight: 1, color: scoreColor(existing.overall_score) }}
          >
            {existing.overall_score}
          </div>
          <div className="shrink-0 hide-on-mobile">
            <VerdictStamp score={existing.overall_score} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={onViewExisting} className="btn-howl">
            <ArrowRight size={14} />
            View existing Read
          </button>
          <button onClick={onCancel} className="btn-ghost">
            <ArrowLeft size={14} />
            Back to intake
          </button>
          <button
            onClick={onProceed}
            className="btn-ghost"
            title="This will create a second entry. The admin can clean up duplicates from the archive."
          >
            <RefreshCw size={14} />
            Run a fresh one anyway
          </button>
        </div>

        <p
          className="text-xs mt-5 pt-4"
          style={{ borderTop: '1px solid var(--howl-cream-deep)', color: 'var(--howl-mute)' }}
        >
          Running a fresh read creates a second entry for {existing.brand_name} in the archive.
          {isAdmin()
            ? ' You can delete the older one from Previous Reads after this finishes.'
            : ' Ask the admin to clean up duplicates if needed.'}
        </p>
      </div>
    </main>
  );
}

function Header({ onReset, showReset, onSignOut, onHistory, showHistory, onQuadrant, showQuadrant }) {
  return (
    <header
      style={{
        borderBottom: '1.5px solid var(--howl-ink)',
        background: 'var(--howl-cream)',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
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
              A diagnostic for impact leaders
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {showHistory && (
            <button
              onClick={onHistory}
              className="btn-ghost"
              title="Previous Reads"
              aria-label="Previous Reads"
            >
              <Clock size={14} />
              <span className="hidden sm:inline">Previous Reads</span>
            </button>
          )}
          {showQuadrant && (
            <button
              onClick={onQuadrant}
              className="btn-ghost"
              title="The Quadrant"
              aria-label="The Quadrant"
            >
              <Grid2X2 size={14} />
              <span className="hidden sm:inline">The Quadrant</span>
            </button>
          )}
          {showReset && (
            <button
              onClick={onReset}
              className="btn-ghost"
              title="New READ"
              aria-label="New READ"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">New READ</span>
            </button>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="btn-ghost"
              title={getUserEmail() ? `Sign out (${getUserEmail()}${isAdmin() ? ', admin' : ''})` : 'Sign out'}
              aria-label="Sign out"
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

function IntakeForm({ onSubmit, disabled, initialValues }) {
  const [brandName, setBrandName] = useState(initialValues?.brandName || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialValues?.websiteUrl || '');
  const [category, setCategory] = useState(initialValues?.category || 'tech');
  const [businessModel, setBusinessModel] = useState(initialValues?.businessModel || 'b2c');
  const [context, setContext] = useState(initialValues?.context || '');
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
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 howl-fadein">
      <div className="grid lg:grid-cols-5 gap-8 lg:items-stretch">
        {/* Left: hero image + headline */}
        <div className="lg:col-span-2 flex flex-col">
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
            className="card-howl overflow-hidden hero-image-card"
            style={{ borderColor: 'var(--howl-ink)' }}
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
        </div>

        {/* Right: the form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 card-howl p-5 sm:p-7 space-y-6">
          <div className="howl-stamp" style={{ fontSize: '0.9375rem' }}>
            01. Pick A Read
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
            The READ uses public information across the brand's website, social, third-party reputation surfaces, and earned media. It automatically discovers the brand's social handles and samples how AI engines describe the brand. It evaluates messaging signals, not internal performance.
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
      'Sampling how AI engines describe the brand.',
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
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-20 text-center howl-fadein">
      <div
        className="howl-stamp mb-3"
        style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}
      >
        {stage === 'load'
          ? 'Loading saved read'
          : stage === 'discovery'
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
        This usually takes 30 to 90 seconds. The Read is checking the brand's actual surfaces.
      </p>
    </main>
  );
}

// ============================================================================
// RADIAL STACKED BAR CHART
// 6 signal wedges. Each wedge stacks 4 surface scores radially from center.
// Outer edge = sum of all surface scores. Inner band labels follow segment angle.
// ============================================================================

// Retro audio equalizer visualization of READ scores. 24 bars total: each of
// the 6 signals gets 4 LED bars (one per surface). Each bar's height is its
// surface score. Bars animate in with a damped-spring response and stagger
// across the chart, like a VU meter coming alive. The dark screen background
// and discrete LED segments make it read like vintage music equipment.
function SignalEqualizer({ signals }) {
  // ----- Geometry -----
  const VB_W = 720;
  const VB_H = 360;
  const BAR_W = 22;
  const BAR_INNER_W = 20;
  const SMALL_GAP = 2;    // within a signal group
  const LARGE_GAP = 20;   // between signal groups
  const N_LEDS = 20;
  const LED_H = 7;
  const LED_GAP = 2.5;
  const LED_PITCH = LED_H + LED_GAP;

  const N_SIGNALS = SIGNALS.length;
  const N_SURFACES = SURFACES.length;
  const GROUP_W = N_SURFACES * BAR_W + (N_SURFACES - 1) * SMALL_GAP;
  const TOTAL_W = N_SIGNALS * GROUP_W + (N_SIGNALS - 1) * LARGE_GAP;
  const LEFT_PAD = (VB_W - TOTAL_W) / 2;

  const BAR_BOTTOM = 285;

  // ----- Animation -----
  const DURATION = 1500;       // per-bar spring duration
  const STAGGER_SIG = 110;     // ms between signal groups
  const STAGGER_SURF = 32;     // ms between surfaces within a group
  const SETTLE_BUFFER = 250;
  const TOTAL_DURATION =
    DURATION + (N_SIGNALS - 1) * STAGGER_SIG +
    (N_SURFACES - 1) * STAGGER_SURF + SETTLE_BUFFER;

  const [tick, setTick] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    startRef.current = performance.now();
    let raf;
    function loop(now) {
      const elapsed = now - startRef.current;
      if (elapsed < TOTAL_DURATION) {
        setTick(elapsed);
        raf = requestAnimationFrame(loop);
      } else {
        setTick(TOTAL_DURATION);
      }
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Underdamped spring response to a step input. Produces the natural
  // overshoot-and-oscillate-and-settle motion of a real VU meter.
  function spring(t, target) {
    if (t <= 0) return 0;
    if (t >= 1) return target;
    const zeta = 0.2;          // damping ratio (under 1 = oscillates)
    const wn = 12;             // natural frequency
    const wd = wn * Math.sqrt(1 - zeta * zeta);
    return target * (1 - Math.exp(-zeta * wn * t) *
      (Math.cos(wd * t) + (zeta * wn / wd) * Math.sin(wd * t)));
  }

  // ----- Palette tuned for the dark "screen" background -----
  const SCREEN_BG = '#1A1611';
  const UNLIT = '#2D2620';
  // EARNED's ink #0A0A0A vanishes on dark; substitute with bone so the bar
  // reads. Other surface colors have enough chroma to survive against dark.
  const SURFACE_COLOR_DARK = {
    WEBSITE: '#D85726',
    SOCIAL: '#F47245',
    REPUTATION: '#C29469',
    EARNED: '#FAF7EF',
  };

  // Tier color for the signal mean number above each group.
  // Mirrors VU semantics: dim coral at the bottom, tan in the middle,
  // bone-bright at the peak.
  function tierColorDark(score) {
    if (score >= 70) return '#FAF7EF';
    if (score >= 40) return '#C29469';
    return '#C24A2A';
  }

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-label="Equalizer chart of READ scores. Twenty-four bars across six signals and four surfaces."
    >
      <defs>
        {/* Same wobble filter the rest of the report uses, so the freehand O
            sitting on top of the screen reads as a brand mark, not a logo. */}
        <filter id="howl-rough-eq" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="3" />
        </filter>
      </defs>

      {/* Dark screen */}
      <rect x={0} y={0} width={VB_W} height={VB_H} fill={SCREEN_BG} rx={3} />

      {/* Top-left stamp */}
      <text
        x={26}
        y={32}
        style={{
          fontFamily: 'Anton, Inter, sans-serif',
          fontSize: 12,
          letterSpacing: '0.18em',
          fill: '#FAF7EF',
          opacity: 0.55,
        }}
      >
        SIGNAL LEVELS
      </text>

      {/* Top-right freehand HOWL O, acts like a maker's mark on the equipment */}
      <g transform={`translate(${VB_W - 36}, 28)`}>
        <circle
          r={13}
          fill="none"
          stroke="var(--howl-coral)"
          strokeWidth={3.5}
          strokeLinecap="round"
          filter="url(#howl-rough-eq)"
        />
      </g>

      {/* Six signal groups */}
      {SIGNALS.map((sig, sigIdx) => {
        const sigData = signals[sig.id];
        if (!sigData) return null;

        const groupX = LEFT_PAD + sigIdx * (GROUP_W + LARGE_GAP);
        const groupCenterX = groupX + GROUP_W / 2;
        const sigPhase = sigIdx * STAGGER_SIG;

        // Compute animated values for the 4 surface bars in this group
        const animatedSurfaces = SURFACES.map((surface, surfIdx) => {
          const target = sigData.by_surface?.[surface.id] ?? 0;
          const phase = sigPhase + surfIdx * STAGGER_SURF;
          const t = Math.max(0, (tick - phase) / DURATION);
          return spring(t, target);
        });

        // The signal mean number naturally rises with the bars
        const groupScore = Math.round(
          animatedSurfaces.reduce((s, v) => s + v, 0) / N_SURFACES
        );

        return (
          <g key={sig.id}>
            {/* Signal mean score above group */}
            <text
              x={groupCenterX}
              y={72}
              textAnchor="middle"
              style={{
                fontFamily: 'Anton, Inter, sans-serif',
                fontSize: 26,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
                fill: tierColorDark(groupScore),
              }}
            >
              {groupScore}
            </text>

            {/* Four LED bars for the four surfaces */}
            {SURFACES.map((surface, surfIdx) => {
              const animatedValue = animatedSurfaces[surfIdx];
              const animatedLeds = (animatedValue / 100) * N_LEDS;
              const color = SURFACE_COLOR_DARK[surface.id];
              const bx = groupX + surfIdx * (BAR_W + SMALL_GAP);

              return (
                <g key={surface.id}>
                  {Array.from({ length: N_LEDS }).map((_, i) => {
                    const isLit = i < animatedLeds;
                    const y = BAR_BOTTOM - (i + 1) * LED_PITCH + LED_GAP;
                    return (
                      <rect
                        key={i}
                        x={bx + 1}
                        y={y}
                        width={BAR_INNER_W}
                        height={LED_H}
                        rx={1.5}
                        fill={isLit ? color : UNLIT}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Signal name below group */}
            <text
              x={groupCenterX}
              y={BAR_BOTTOM + 26}
              textAnchor="middle"
              style={{
                fontFamily: 'Anton, Inter, sans-serif',
                fontSize: 13,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fill: '#FAF7EF',
                opacity: 0.88,
              }}
            >
              {sig.name}
            </text>
          </g>
        );
      })}

      {/* Compact legend embedded in the screen */}
      {(() => {
        const itemW = 108;
        const legendTotalW = N_SURFACES * itemW;
        const legendX = (VB_W - legendTotalW) / 2;
        return (
          <g>
            {SURFACES.map((s, i) => {
              const x = legendX + i * itemW;
              const y = VB_H - 18;
              return (
                <g key={s.id}>
                  <rect
                    x={x}
                    y={y - 7}
                    width={10}
                    height={10}
                    rx={1.5}
                    fill={SURFACE_COLOR_DARK[s.id]}
                  />
                  <text
                    x={x + 16}
                    y={y + 1}
                    style={{
                      fontFamily: 'Anton, Inter, sans-serif',
                      fontSize: 10,
                      letterSpacing: '0.13em',
                      fill: '#FAF7EF',
                      opacity: 0.55,
                    }}
                  >
                    {s.name.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })()}
    </svg>
  );
}

// Counts a number up from 0 to `value` on mount with ease-out cubic. Used for
// the headline overall score so it feels like a meter settling, alongside the
// equalizer that animates with spring physics on the same page load.
function AnimatedNumber({ value, duration = 1400 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let raf;
    function loop(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display}</>;
}

// ============================================================================
// REPORT
// ============================================================================

function ReadReport({ report, onReset, brandMeta, saveStatus, savedReadId, readOnly }) {
  const overall = report.overall_score;
  const verdict = getVerdict(overall);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  // Category-editing state. Initialize from brandMeta; updates ride through
  // the local override so we can show the change instantly without round-
  // tripping through props.
  const [editingCategory, setEditingCategory] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(brandMeta?.category || '');
  const [categorySavedFlash, setCategorySavedFlash] = useState(false);

  const categoryDisplayName = CATEGORIES.find((c) => c.id === currentCategory)?.name;
  const businessModelName = BUSINESS_MODELS.find((m) => m.id === brandMeta?.businessModel)?.name;

  async function handleCategoryChange(newCat) {
    if (!savedReadId || !newCat || newCat === currentCategory) {
      setEditingCategory(false);
      return;
    }
    const result = await updateReadCategory(savedReadId, newCat);
    if (result.ok) {
      setCurrentCategory(newCat);
      setCategorySavedFlash(true);
      setTimeout(() => setCategorySavedFlash(false), 1500);
    }
    setEditingCategory(false);
  }

  const shareUrl = savedReadId
    ? `${window.location.origin}${window.location.pathname}?read=${savedReadId}`
    : null;

  async function handleShare() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2200);
    } catch {
      // Clipboard API can fail in older browsers / non-secure contexts.
      // Fall back to a prompt so the user can copy manually.
      window.prompt('Copy this link:', shareUrl);
    }
  }

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
      lines.push('## HOW AI DESCRIBES YOU (unprompted, no web search) ##');
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
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 howl-fadein">
      {/* Verdict header */}
      <div className="mb-10">
        <div className="howl-stamp mb-1" style={{ fontSize: '0.875rem', color: 'var(--howl-coral)' }}>
          The READ, {brandMeta.brandName}
        </div>
        {/* Editable metadata line: category, business model. The category
            can be corrected after a Read is saved without re-running. */}
        <div
          className="text-[11px] tracking-wide uppercase mb-4 flex items-center gap-2 flex-wrap"
          style={{ color: 'var(--howl-mute)' }}
        >
          {editingCategory && savedReadId && !readOnly ? (
            <select
              value={currentCategory || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              onBlur={() => setEditingCategory(false)}
              autoFocus
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                border: '1px solid var(--howl-ink)',
                background: 'var(--howl-cream)',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <>
              <span>
                {categoryDisplayName || 'Uncategorized'}
                {businessModelName ? ` · ${businessModelName}` : ''}
              </span>
              {savedReadId && !readOnly && (
                <button
                  onClick={() => setEditingCategory(true)}
                  title="Edit category"
                  style={{
                    padding: '2px 4px',
                    color: 'var(--howl-mute)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <Pencil size={11} />
                </button>
              )}
              {categorySavedFlash && (
                <span style={{ color: 'var(--howl-strong)', fontWeight: 600 }}>
                  ✓ saved
                </span>
              )}
            </>
          )}
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
              <AnimatedNumber value={overall} />
            </div>
            <div className="text-[10px] tracking-[0.15em] uppercase opacity-70">/ 100</div>
          </div>
        </div>
      </div>

      {/* Verdict pull-quote was here, moved into the right panel below where
          it replaces the duplicate signal bars (data already shown in the EQ). */}

      {/* Signal equalizer + summary */}
      <div className="grid md:grid-cols-5 gap-6 mb-12">
        <div className="card-howl p-5 sm:p-6 md:col-span-3 flex flex-col">
          <div className="howl-stamp mb-4" style={{ fontSize: '0.8125rem' }}>
            Six Signals, How Loud
          </div>
          <SignalEqualizer signals={report.signals} />
          <p className="text-xs text-center mt-4" style={{ color: 'var(--howl-mute)' }}>
            Each cluster is a signal. The four bars show how loud the brand reads across each surface: Website, Social, Reputation, Earned.
          </p>

          {/* Belief modifier: flags the relationship between overall volume and
              audience credibility without folding belief into the headline score.
              Placed here (below the chart) so the chart card balances against
              the per-signal list in the summary card on the right. */}
          {(() => {
            if (!report.belief) return null;
            const scores = BELIEF_IDS
              .map((id) => report.belief[id]?.score)
              .filter((s) => typeof s === 'number');
            if (scores.length === 0) return null;
            const beliefAvg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            const delta = beliefAvg - overall;

            let read;
            if (delta >= 15) {
              read = 'Underrated. Audiences trust the story more than the brand is broadcasting it.';
            } else if (delta >= 5) {
              read = 'Audiences are giving more credit than the messaging earns.';
            } else if (delta <= -15) {
              read = 'Shouting without trust. Audiences hear the brand but do not believe it.';
            } else if (delta <= -5) {
              read = 'Volume runs ahead of credibility. The claims land as more aspirational than earned.';
            } else {
              read = 'In sync. Volume and credibility are moving together.';
            }

            return (
              <div
                className="mt-6 p-4 sm:p-5 flex-1"
                style={{
                  background: 'var(--howl-cream)',
                  border: '1px solid var(--howl-cream-deep)',
                }}
              >
                <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                  <div className="shrink-0">
                    <div
                      className="howl-stamp mb-1"
                      style={{ fontSize: '0.6875rem', color: 'var(--howl-mute)', letterSpacing: '0.12em' }}
                    >
                      Belief modifier
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-display tabular-nums"
                        style={{ fontSize: '2rem', lineHeight: 1, color: scoreColor(beliefAvg) }}
                      >
                        {beliefAvg}
                      </span>
                      <span
                        className="text-[10px] tracking-[0.15em] uppercase"
                        style={{ color: 'var(--howl-mute)' }}
                      >
                        / 100
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.5 }}>
                      Overall reflects messaging volume across the six signals. The Belief Read tracks
                      audience reception separately and is not folded into the headline score.{' '}
                      <span style={{ color: 'var(--howl-ink)', fontWeight: 600 }}>{read}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="card-howl p-5 sm:p-6 md:col-span-2">
          <div className="howl-stamp mb-4" style={{ fontSize: '0.8125rem' }}>The Read</div>

          {/* Verdict pull-quote, moved from above the chart grid. Sits at the
              top of the right panel so the eye lands on the HOWL-voice
              one-liner first, then descends into the analytical summary. */}
          {report.verdict && (
            <div
              className="mb-5 p-4 sm:p-5"
              style={{
                background: 'var(--howl-bone)',
                borderLeft: '4px solid var(--howl-coral)',
              }}
            >
              <p className="text-base leading-snug" style={{ fontStyle: 'italic' }}>
                "{report.verdict}"
              </p>
            </div>
          )}

          {report.summary && (
            <p
              className="text-base"
              style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.55 }}
            >
              {report.summary}
            </p>
          )}
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
              <div key={sig.id} className="card-howl p-5 sm:p-6">
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
        standards={[
          'Sharpens who the brand is, not just what it says.',
          'Names a specific signal weakness from this READ and fixes it.',
          'Converts credibility into reach, or builds trust where volume runs ahead.',
          'Ownable. Not a move any competitor could copy and paste.',
        ]}
        bg="var(--howl-ink)"
        fg="var(--howl-bone)"
        accent="var(--howl-ink)"
      />

      <RecommendationBlock
        label="PLAY"
        sublabel="Creative provocations to earn attention beyond the feed."
        icon={<Sparkles size={20} />}
        recommendations={report.play || []}
        standards={[
          'Talkable. Audiences would repeat or share it without being asked.',
          'Benefit-led, not duty-led. Desire over obligation.',
          'Specific to this brand. Not category-generic.',
          'Could ship inside the brand\u2019s current creative and operational capability.',
        ]}
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
                What AI says about you
              </div>
              <div
                className="card-howl p-5 sm:p-6 h-full"
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
                  Sampled from a major AI engine with no web search, this is your footprint in AI training data. If this reads thin, vague, or wrong, that is a REPUTATION finding in its own right.
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
                className="card-howl p-5 sm:p-6 h-full"
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

      {saveStatus && (
        <div className="flex justify-center pt-4">
          {saveStatus === 'saving' && (
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--howl-mute)' }}
            >
              <Loader2 size={12} className="animate-spin" />
              <span>Saving to history.</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--howl-strong)' }}
            >
              <Check size={12} />
              <span>Saved to history.</span>
            </div>
          )}
          {typeof saveStatus === 'object' && saveStatus?.error && (
            <div
              className="card-howl p-3 max-w-xl"
              style={{ borderColor: 'var(--howl-weak)', background: 'rgba(183, 53, 37, 0.04)' }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--howl-weak)' }} />
                <div>
                  <div
                    className="howl-stamp"
                    style={{ fontSize: '0.6875rem', color: 'var(--howl-weak)', letterSpacing: '0.1em' }}
                  >
                    Save failed
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--howl-ink-soft)', lineHeight: 1.45 }}>
                    {saveStatus.error}
                  </p>
                  {saveStatus.detail && (
                    <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--howl-mute)' }}>
                      {saveStatus.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center pt-6">
        <button onClick={copyText} className="btn-ghost">
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy the READ</>}
        </button>
        {shareUrl && (
          <button onClick={handleShare} className="btn-ghost" title="Copy a shareable link to this READ">
            {shareCopied ? (
              <><Check size={14} /> Link copied</>
            ) : (
              <><Share2 size={14} /> Share link</>
            )}
          </button>
        )}
        <button onClick={() => window.print()} className="btn-ghost">
          <Printer size={14} />
          Print
        </button>
        {!readOnly && (
          <button onClick={onReset} className="btn-howl">
            <RefreshCw size={14} />
            Run a new READ
          </button>
        )}
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
            <div key={d.id} className="card-howl p-5 sm:p-6 flex flex-col">
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
          className="p-5 sm:p-6"
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

function RecommendationBlock({ label, sublabel, icon, recommendations, standards, bg, fg, accent }) {
  if (!recommendations || recommendations.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="p-5 sm:p-6 mb-5" style={{ background: bg, color: fg, border: `1.5px solid ${accent}` }}>
        <div className="flex items-center gap-3 mb-1">
          {icon}
          <div className="font-display" style={{ fontSize: '2.25rem', lineHeight: 1 }}>
            {label}
          </div>
        </div>
        <p className="text-sm opacity-85">{sublabel}</p>
      </div>

      {/* Standards panel: full-width editorial brief shown before the
          recommendation grid. Criteria lay out in a responsive horizontal
          grid (4 cols desktop, 2 tablet, 1 mobile) so the panel uses its
          horizontal space instead of stacking vertically and squashing. */}
      {standards && standards.length > 0 && (
        <div
          className="mb-5 p-5 sm:p-6"
          style={{
            background: 'var(--howl-cream)',
            border: `1.5px solid ${accent}`,
            borderLeftWidth: '4px',
          }}
        >
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
            <div
              className="howl-stamp"
              style={{ fontSize: '0.6875rem', color: 'var(--howl-mute)', letterSpacing: '0.14em' }}
            >
              Standards
            </div>
            <p
              className="text-xs"
              style={{ color: 'var(--howl-mute)', fontStyle: 'italic' }}
            >
              Every {label.toLowerCase()} below had to meet these.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {standards.map((s, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span
                  className="font-display shrink-0 tabular-nums"
                  style={{
                    fontSize: '1.5rem',
                    lineHeight: 1,
                    color: accent,
                    minWidth: '1.75rem',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="text-sm"
                  style={{ color: 'var(--howl-ink)', lineHeight: 1.4 }}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations in a 3-column grid since the AI returns exactly 3
          per section. Each cell gets equal horizontal real estate, no empty
          slot at the end of the row. */}
      <div className="grid md:grid-cols-3 gap-4">
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

function ErrorScreen({ error, onBack, onSignOut }) {
  const isAuth =
    /unauthor/i.test(error) ||
    /session expired/i.test(error) ||
    /401/.test(error);

  function handleSignOutAndReload() {
    clearPassword();
    window.location.reload();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20 howl-fadein">
      <div className="card-howl p-5 sm:p-7" style={{ borderColor: 'var(--howl-weak)' }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={20} style={{ color: 'var(--howl-weak)' }} />
          <div className="howl-stamp" style={{ fontSize: '1rem', color: 'var(--howl-weak)' }}>
            {isAuth ? 'Session expired' : 'The READ stalled'}
          </div>
        </div>

        {isAuth ? (
          <>
            <p className="mb-5" style={{ color: 'var(--howl-ink-soft)' }}>
              Your saved password is no longer valid. This usually happens after
              the team rotates the password or redeploys.
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--howl-mute)' }}>
              Sign in again to continue. Your past reads in the archive are unaffected.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleSignOutAndReload} className="btn-howl">
                <Lock size={14} />
                Sign in again
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-5" style={{ color: 'var(--howl-ink-soft)' }}>{error}</p>
            <p className="text-sm mb-6" style={{ color: 'var(--howl-mute)' }}>
              If this keeps happening, check that <code>ANTHROPIC_API_KEY</code> and{' '}
              <code>ACCESS_PASSWORD</code> are set on your Vercel environment, and
              that the brand URL is reachable.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={onBack} className="btn-howl">
                <ArrowLeft size={14} />
                Try again
              </button>
              <button onClick={handleSignOutAndReload} className="btn-ghost">
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </>
        )}
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

EMPTY QUALIFIERS RULE: Never use intensifier adjectives that try to make a claim sound stronger but actually weaken it. Banned words: "genuine", "real", "authentic", "true", "actual", "truly", "really", "meaningful" (when used as a generic intensifier). If a brand has cultural equity, call it cultural equity, not "genuine cultural equity". If a brand has momentum, call it momentum, not "real momentum". The qualifier signals doubt, which is the opposite of the certainty HOWL writes with. Strip these words on every output. Exception: "authentic" is allowed only when discussing the literal concept of authenticity as a strategic posture, never as a weasel adjective.

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
3. Search for what the brand is reviewed for on Trustpilot, Glassdoor, Reddit (subreddits and threads naming the brand), and relevant App stores.
4. Check the brand's Wikipedia page if one exists: how is the brand framed, what controversies or critiques are documented, what citations are used.
5. Search for tier-one earned media coverage from the last 12 months.
6. Search for greenwashing or credibility commentary about the brand on Reddit and in earned media.
7. Search for industry-specific trust signals tied to the brand: B Corp certification, ISO standards, Fair Trade, CDP scores, sustainability ratings (MSCI, Sustainalytics), regulatory filings.
8. Note how publicly accessible AI information describes the brand.

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
    { "title": "Short verb-led name", "rationale": "1-2 sentences in HOWL voice. Why this strategic move, why for THIS brand, naming specific evidence", "addresses": ["SIGNAL_OR_BELIEF_ID"] },
    { "title": "...", "rationale": "...", "addresses": ["SIGNAL_OR_BELIEF_ID"] },
    { "title": "...", "rationale": "...", "addresses": ["SIGNAL_OR_BELIEF_ID", "SIGNAL_OR_BELIEF_ID"] }
  ],
  "play": [
    { "title": "Short verb-led name", "rationale": "1-2 sentences in HOWL voice. The creative provocation and why it's earnable for THIS brand", "addresses": ["SIGNAL_OR_BELIEF_ID"] },
    { "title": "...", "rationale": "...", "addresses": ["SIGNAL_OR_BELIEF_ID"] },
    { "title": "...", "rationale": "...", "addresses": ["SIGNAL_OR_BELIEF_ID"] }
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
- BELIEF GAP RULE for EDGE: Before finalizing EDGE, compute the Belief average (mean of trusted/proven/participatory scores) and compare it to the Six Signals average. The deltas reshape EDGE as follows:
   * If Belief is 10+ points BELOW the signal average: the brand is shouting without trust. AT LEAST ONE of the three EDGE recommendations MUST address a belief dimension (TRUSTED, PROVEN, or PARTICIPATORY), not a volume signal. Pure volume EDGE makes the problem worse, not better. Name the specific credibility gap and the move that closes it.
   * If Belief is 15+ points ABOVE the signal average: the brand has latent credibility it is failing to broadcast. At least one EDGE should convert that audience trust into reach (e.g., a volume move that points back at the proven-impact substrate).
   * If Belief is within 9 points of the signal average: EDGE can stay focused on signal weaknesses without forcing a belief recommendation.
- "addresses" arrays use UPPERCASE IDs from one of these sets:
   * SIGNAL IDs: VOLUME, INTEGRATION, IDENTITY, CANDOR, DESIRE, MOMENTUM
   * BELIEF DIMENSION IDs: TRUSTED, PROVEN, PARTICIPATORY
   A single recommendation can mix signal and belief targets, e.g. ["CANDOR", "TRUSTED"].
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
  if (!text) throw new Error('Empty response from the analytical engine.');
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
// SHARED READ VIEW — public, read-only view of a saved READ via ?read=UUID.
// Bypasses the password gate so the URL can be sent to clients / colleagues.
// ============================================================================

function SharedHeader() {
  return (
    <header
      style={{
        borderBottom: '1.5px solid var(--howl-ink)',
        background: 'var(--howl-cream)',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
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
              A diagnostic for impact leaders
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={window.location.pathname}
            className="btn-ghost"
            title="Run your own READ"
            aria-label="Run your own READ"
          >
            <Megaphone size={14} />
            <span className="hidden sm:inline">Run your own READ</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function SharedReadView({ id }) {
  const [report, setReport] = useState(null);
  const [brandMeta, setBrandMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!id) {
      setErrorMsg('No READ id in the URL.');
      setLoading(false);
      return;
    }
    if (!supabaseEnabled) {
      setErrorMsg('History is not configured for this deployment.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchReadById(id).then((row) => {
      if (cancelled) return;
      if (!row || !row.report) {
        setErrorMsg('This READ could not be found. It may have been deleted.');
      } else {
        setReport(row.report);
        setBrandMeta(row.brand_meta || { brandName: row.brand_name });
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  return (
    <>
      <SharedHeader />
      {loading && (
        <main className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center howl-fadein">
          <div
            className="inline-flex items-center gap-3"
            style={{ color: 'var(--howl-mute)' }}
          >
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading the READ.</span>
          </div>
        </main>
      )}
      {!loading && errorMsg && (
        <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20 howl-fadein">
          <div className="card-howl p-5 sm:p-7" style={{ borderColor: 'var(--howl-weak)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} style={{ color: 'var(--howl-weak)' }} />
              <div
                className="howl-stamp"
                style={{ fontSize: '1rem', color: 'var(--howl-weak)' }}
              >
                READ not found
              </div>
            </div>
            <p style={{ color: 'var(--howl-ink-soft)' }}>{errorMsg}</p>
            <a href={window.location.pathname} className="btn-howl mt-5 inline-flex">
              <Megaphone size={14} />
              Run your own READ
            </a>
          </div>
        </main>
      )}
      {!loading && report && brandMeta && (
        <ReadReport
          report={report}
          brandMeta={brandMeta}
          savedReadId={id}
          readOnly={true}
          onReset={() => { window.location.href = window.location.pathname; }}
        />
      )}
      <BuildBadge />
    </>
  );
}

// ============================================================================
// APP
// ============================================================================

const STORAGE_KEY = 'howl-read:last';

export default function App() {
  // Shareable read URLs: ?read={uuid} on the URL means render a public view
  // of that saved read, bypassing the password gate. This is how someone
  // sends a client a link to a finished READ.
  const sharedReadId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('read')
      : null;
  if (sharedReadId) {
    return <SharedReadView id={sharedReadId} />;
  }
  return <MainApp />;
}

function MainApp() {
  const [view, setView] = useState('intake');
  const [stage, setStage] = useState(null);
  const [brandMeta, setBrandMeta] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | { error: string }
  const [savedReadId, setSavedReadId] = useState(null);
  const [duplicateExisting, setDuplicateExisting] = useState(null);
  const [pendingMeta, setPendingMeta] = useState(null);

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

  // Entry point for the form. Checks for a duplicate first; if found, shows
  // the warning UI instead of running. The user can then choose to view the
  // existing read, override and run fresh, or cancel.
  async function runRead(meta, { skipDuplicateCheck = false } = {}) {
    setError('');
    setSubmitting(true);

    if (supabaseEnabled && !skipDuplicateCheck) {
      try {
        const existing = await findExistingRead(meta.brandName, meta.websiteUrl);
        if (existing) {
          setDuplicateExisting(existing);
          setPendingMeta(meta);
          setView('duplicate');
          setSubmitting(false);
          return;
        }
      } catch (e) {
        // Duplicate check is a best-effort feature. If it fails (network,
        // RLS, whatever), don't block the user; just log and continue.
        console.warn('[HOWL READ] duplicate check failed, proceeding:', e);
      }
    }

    await executeRead(meta);
  }

  async function executeRead(meta) {
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
          webSearchMaxUses: 10,
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

      // Telemetry: fire a Vercel Analytics event so we can see aggregate
      // patterns across reads (score distributions, category coverage,
      // verdict tier frequency). No PII, brand names only.
      try {
        const verdict = getVerdict(normalized.overall_score);
        track('read_completed', {
          brand: meta.brandName,
          category: meta.category,
          business_model: meta.businessModel,
          overall_score: normalized.overall_score,
          verdict: verdict.id,
        });
      } catch { /* analytics is best-effort */ }

      // Persist to Supabase in the background. Don't block the report on it.
      if (supabaseEnabled) {
        setSaveStatus('saving');
        setSavedReadId(null);
        saveRead(meta, normalized)
          .then((result) => {
            if (result.ok) {
              setSaveStatus('saved');
              if (result.data?.id) setSavedReadId(result.data.id);
            } else {
              setSaveStatus({
                error: supabaseConnectionHelp(result.reason),
                detail: result.message,
              });
            }
          })
          .catch((e) => {
            setSaveStatus({ error: 'Save failed.', detail: e.message });
          });
      } else {
        setSaveStatus(null);
        setSavedReadId(null);
      }

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
    setSaveStatus(null);
    setSavedReadId(null);
    setDuplicateExisting(null);
    setPendingMeta(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setView('intake');
  }

  // Load a saved read from Supabase (no re-run, just display the stored result).
  async function loadFromHistory(row) {
    if (!row?.id) return;
    setError('');
    setView('running');
    setStage('load');
    setBrandMeta(row.brand_meta || { brandName: row.brand_name });
    setSavedReadId(row.id); // for share link
    const full = await fetchReadById(row.id);
    if (!full || !full.report) {
      setError('Could not load that saved READ.');
      setView('error');
      setStage(null);
      return;
    }
    setBrandMeta(full.brand_meta);
    setReport(full.report);
    setSaveStatus('saved'); // it's already saved
    setView('report');
    setStage(null);
  }

  // Re-run a READ using a previous read's brand inputs.
  function rerunFromHistory(row) {
    if (!row?.brand_meta) return;
    // Re-run from history is an explicit, intentional re-run of an existing
    // brand. Skip the duplicate check so the warning UI doesn't appear.
    runRead(row.brand_meta, { skipDuplicateCheck: true });
  }

  // Duplicate-warning handlers.
  function viewExistingFromWarning() {
    const existing = duplicateExisting;
    setDuplicateExisting(null);
    setPendingMeta(null);
    if (existing) loadFromHistory(existing);
  }
  function proceedDespiteDuplicate() {
    const meta = pendingMeta;
    setDuplicateExisting(null);
    setPendingMeta(null);
    if (meta) executeRead(meta);
  }
  function cancelDuplicate() {
    setDuplicateExisting(null);
    // Intentionally keep pendingMeta so IntakeForm pre-fills with the values
    // the user just submitted, instead of clearing the form.
    setView('intake');
  }

  function signOut() {
    clearPassword();
    window.location.reload();
  }

  const historyAvailable = supabaseStatus !== 'not-configured';

  return (
    <PasswordGate>
      <Header
        onReset={reset}
        showReset={view !== 'intake'}
        onSignOut={signOut}
        onHistory={() => setView('history')}
        showHistory={historyAvailable && view !== 'history'}
        onQuadrant={() => setView('quadrant')}
        showQuadrant={historyAvailable && view !== 'quadrant'}
      />
      {view === 'intake' && (
        <IntakeForm
          onSubmit={runRead}
          disabled={submitting}
          initialValues={pendingMeta}
        />
      )}
      {view === 'duplicate' && duplicateExisting && (
        <DuplicateWarning
          existing={duplicateExisting}
          onViewExisting={viewExistingFromWarning}
          onProceed={proceedDespiteDuplicate}
          onCancel={cancelDuplicate}
        />
      )}
      {view === 'history' && (
        <HistoryView
          onLoad={loadFromHistory}
          onRerun={rerunFromHistory}
          onReset={reset}
        />
      )}
      {view === 'quadrant' && (
        <QuadrantView
          onLoad={loadFromHistory}
          onReset={reset}
        />
      )}
      {view === 'running' && (
        <RunningRead brandName={brandMeta?.brandName || ''} stage={stage} />
      )}
      {view === 'report' && report && brandMeta && (
        <ReadReport
          report={report}
          onReset={reset}
          brandMeta={brandMeta}
          saveStatus={saveStatus}
          savedReadId={savedReadId}
        />
      )}
      {view === 'error' && <ErrorScreen error={error} onBack={reset} />}
      <BuildBadge />
    </PasswordGate>
  );
}
