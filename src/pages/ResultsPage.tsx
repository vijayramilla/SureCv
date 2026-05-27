import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Mail, Copy, Check, ArrowLeft, ArrowRight, PenLine, Hash, CheckCircle2, Briefcase, Building2, Lightbulb, Info, Lock, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { getResumeById } from '../lib/storage';
import { generateCoverLetter } from '../lib/aiOptimization';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlanFeatures } from '../hooks/usePlanFeatures';
import UpgradeModal from '../components/UpgradeModal';
import { DownloadResumeButton } from '../components/ResumePDF';
import { DownloadCoverLetterButton } from '../components/CoverLetterPDF';

/* ─── Animated Score Ring ─── */
function ScoreRing({ score, size = 100, label }: { score: number; size?: number; label: string }) {
  const [displayed, setDisplayed] = useState(0);
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;

  useEffect(() => {
    let start: number | null = null;
    const duration = 1200;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#eab308' : '#ef4444';
  const glowColor = score >= 70 ? 'rgba(34,197,94,0.4)' : score >= 45 ? 'rgba(234,179,8,0.4)' : 'rgba(239,68,68,0.4)';

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[#64748b] text-[10px] font-semibold uppercase tracking-[0.15em]">{label}</p>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow behind */}
        <div className="absolute inset-0 rounded-full blur-xl opacity-40" style={{ background: glowColor }} />
        <svg width={size} height={size} className="relative z-10 -rotate-90">
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <span className="text-2xl font-black tabular-nums" style={{ color }}>{displayed}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Bar ─── */
function ScoreBar({ label, before, after, getBarColor }: { label: string; before: number; after: number; getBarColor: (n: number) => string }) {
  return (
    <div className="space-y-1.5 group">
      <div className="flex justify-between text-xs">
        <span className="text-[#64748b] group-hover:text-[#94a3b8] transition-colors">{label}</span>
        <span className="font-medium tabular-nums">
          <span className="text-[#475569]">{before}</span>
          <span className="text-[#334155] mx-1.5">→</span>
          <span className="text-green-400 font-bold">{after}</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-white/10 rounded-full" style={{ width: `${before}%` }} />
        <div
          className={`h-full -mt-1.5 rounded-full transition-all duration-1000 ${getBarColor(after)}`}
          style={{ width: `${after}%`, boxShadow: `0 0 8px currentColor` }}
        />
      </div>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ dot, title, subtitle }: { dot: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dot}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
      </span>
      <div>
        <h2 className="text-white font-bold text-sm tracking-tight">{title}</h2>
        {subtitle && <p className="text-[#475569] text-[10px] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const toast = useToast();
  const { user } = useAuth();
  const planFeatures = usePlanFeatures();
  const [record, setRecord] = useState<ReturnType<typeof getResumeById>>(null);
  const [copied, setCopied] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [generatingCover, setGeneratingCover] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'starter' | 'power'>('starter');

  useEffect(() => {
    if (id && user) {
      const found = getResumeById(user.uid, id);
      setRecord(found);
    }
  }, [id, user]);

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#94a3b8] text-lg mb-4">Result not found</p>
          <Link to="/optimize" className="btn-primary">
            Create New Optimization
          </Link>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(record.optimizedResume);
    setCopied(true);
    toast('Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCoverLetter = async () => {
    if (!planFeatures.canGenerateCoverLetter) {
      setUpgradePlan('starter');
      setShowUpgradeModal(true);
      return;
    }
    
    setGeneratingCover(true);
    try {
      const letter = await generateCoverLetter(record.originalResume, record.jobDescription, record.candidateName);
      setCoverLetter(letter);
      setShowCoverLetter(true);
      toast('Cover letter generated!', 'success');
    } catch {
      toast('Failed to generate cover letter', 'error');
    } finally {
      setGeneratingCover(false);
    }
  };

  const getBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 45) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const scoreLift = record.scoreLift ?? (record.optimizedScore - record.originalScore);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen px-4 py-8 relative"
    >
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-green-600/6 rounded-full blur-3xl" />
      </div>

      {/* ── TOP HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <Link to="/optimize" className="inline-flex items-center gap-1.5 text-[#475569] hover:text-white text-xs mb-5 transition-colors group">
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Optimizer
        </Link>

        {/* Candidate banner */}
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-r from-white/[0.03] via-white/[0.06] to-white/[0.03] backdrop-blur-sm p-5">
          {/* Subtle top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/40 to-purple-800/40 border border-purple-500/20 flex items-center justify-center text-purple-300 font-black text-lg shadow-lg">
                  {record.candidateName?.charAt(0) || 'C'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0D0D1A] flex items-center justify-center">
                  <Check size={8} className="text-white" strokeWidth={3} />
                </div>
              </div>
              <div>
                <p className="text-white font-bold text-base">{record.candidateName || ''}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {record.targetRole && (
                    <span className="flex items-center gap-1 text-[#64748b] text-xs">
                      <Briefcase size={11} />
                      {record.targetRole}
                    </span>
                  )}
                  {record.targetCompany && (
                    <span className="flex items-center gap-1 text-[#64748b] text-xs">
                      <Building2 size={11} />
                      {record.targetCompany}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Score improvement pill */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                <TrendingUp size={15} className="text-green-400" />
                <div>
                  <p className="text-green-400 font-black text-lg leading-none">+{scoreLift}</p>
                  <p className="text-green-600 text-[10px]">pts gained</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2">
                <Zap size={15} className="text-purple-400" />
                <div>
                  <p className="text-purple-400 font-black text-lg leading-none">{record.optimizedScore}</p>
                  <p className="text-purple-600 text-[10px]">ATS score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3-COLUMN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* ════════════════════════════
            LEFT — Resume Preview
        ════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-white/[0.025] backdrop-blur-sm"
          style={{ minHeight: 'calc(100vh - 260px)' }}
        >
          {/* Column header */}
          <div className="px-5 pt-5 pb-4 border-b border-white/6">
            <SectionHeader dot="bg-purple-500" title="Optimized Resume" subtitle={`${record.optimizedResume.length} characters`} />
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-xl border transition-all duration-200
                border-white/10 text-[#64748b] hover:text-white hover:border-purple-500/40 hover:bg-purple-500/5"
            >
              <AnimatePresence mode="wait">
                {copied
                  ? <motion.span key="check" initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-green-400"><Check size={13} /> Copied!</motion.span>
                  : <motion.span key="copy" initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="flex items-center gap-1.5"><Copy size={13} /> Copy to Clipboard</motion.span>
                }
              </AnimatePresence>
            </button>
          </div>

          {/* Resume text */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div className="bg-white rounded-xl p-5 shadow-2xl">
              <pre className="text-gray-800 text-[11px] leading-relaxed whitespace-pre-wrap font-mono">
                {record.optimizedResume}
              </pre>
            </div>
          </div>

          {/* Downloads pinned to bottom */}
          <div className="p-4 border-t border-white/6 space-y-2 bg-black/20">
            <DownloadResumeButton
              resumeText={record.optimizedResume}
              candidateName={record.candidateName || record.optimizedResume?.split('\n').map(l => l.trim()).filter(l => l.length > 0)[0] || 'Candidate'}
            />
            {planFeatures.canDownloadDOCX ? (
              <button className="w-full btn-outline text-sm gap-2">
                <FileDown size={15} />
                Download DOCX
              </button>
            ) : (
              <button
                onClick={() => { setUpgradePlan('starter'); setShowUpgradeModal(true); }}
                className="w-full flex items-center justify-center gap-2 border border-white/8 text-white/30 px-4 py-2.5 rounded-xl cursor-not-allowed relative hover:border-purple-500/20 transition-colors text-sm group"
              >
                <Lock size={14} className="text-purple-400/60 group-hover:text-purple-400 transition-colors" />
                Download DOCX
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-lg">
                  Starter
                </span>
              </button>
            )}
          </div>
        </motion.div>

        {/* ════════════════════════════
            MIDDLE — What Changed
        ════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {/* Stats cards */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
            <SectionHeader dot="bg-emerald-500" title="What Changed" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <PenLine size={14} />, value: record.bulletsRewritten ?? 0, label: 'Bullets', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                { icon: <Hash size={14} />, value: record.keywordsInjected ?? 0, label: 'Keywords', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                { icon: <Sparkles size={14} />, value: record.skillsAdded?.length ?? 0, label: 'Skills', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              ].map((stat) => (
                <div key={stat.label} className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 ${stat.bg}`}>
                  <span className={stat.color}>{stat.icon}</span>
                  <p className={`text-2xl font-black tabular-nums ${stat.color}`}>{stat.value}</p>
                  <p className="text-[#64748b] text-[10px] font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords Added */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#475569] mb-3">Keywords Added</p>
            {record.keywordsAdded?.length === 0
              ? <p className="text-[#334155] text-xs">None needed — great match!</p>
              : (
                <div className="flex flex-wrap gap-1.5">
                  {record.keywordsAdded?.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <span className="text-emerald-500">+</span>{kw}
                    </span>
                  ))}
                </div>
              )}
          </div>

          {/* Keywords Present */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#475569] mb-3">Keywords Present</p>
            {record.keywordsMissing?.length === 0
              ? <p className="text-emerald-500/60 text-xs">✓ Full coverage — no gaps</p>
              : (
                <div className="flex flex-wrap gap-1.5">
                  {record.keywordsMissing?.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <CheckCircle2 size={9} className="text-cyan-500" />{kw}
                    </span>
                  ))}
                </div>
              )}
          </div>

          {/* Verbs Improved */}
          {record.weakVerbsReplaced && record.weakVerbsReplaced.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#475569] mb-3">Verbs Improved</p>
              <div className="space-y-2">
                {record.weakVerbsReplaced.map((verb, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-orange-400/70 line-through font-mono">{verb.split('->')[0]?.trim()}</span>
                    <ArrowRight size={10} className="text-[#334155] shrink-0" />
                    <span className="text-green-400 font-semibold font-mono">{verb.split('->')[1]?.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {record.improvementsSummary && record.improvementsSummary.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#475569] mb-3">Improvements</p>
              <ul className="space-y-2">
                {record.improvementsSummary.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[#94a3b8] text-xs leading-relaxed">
                    <CheckCircle2 size={13} className="text-green-500 shrink-0 mt-0.5" />
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recruiter Tips */}
          {record.recruiterTips && record.recruiterTips.length > 0 && (
            <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Info size={11} className="text-blue-400" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-400/70">Recruiter Tips</p>
              </div>
              <ul className="space-y-2">
                {record.recruiterTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[#64748b] text-xs leading-relaxed">
                    <Lightbulb size={11} className="text-blue-400/70 shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* ════════════════════════════
            RIGHT — ATS Score
        ════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          {/* Before / After circles */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
            <SectionHeader dot="bg-purple-500" title="ATS Score" subtitle="Applicant Tracking System" />
            <div className="flex items-center justify-center gap-4">
              <ScoreRing score={record.originalScore} label="Before" size={96} />

              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <ArrowRight size={14} className="text-green-400" />
                </div>
                <div className="bg-gradient-to-b from-green-500/20 to-green-600/10 border border-green-500/25 text-green-400 text-xs font-black px-2.5 py-1.5 rounded-xl text-center">
                  +{scoreLift}<br />
                  <span className="text-[9px] font-medium opacity-70">points</span>
                </div>
              </div>

              <ScoreRing score={record.optimizedScore} label="After" size={96} />
            </div>

            {/* Rubric line */}
            <div className="mt-5 pt-4 border-t border-white/6">
              <p className="text-[10px] text-[#334155] leading-relaxed text-center">
                <span className="text-[#475569]">Parsability</span> · <span className="text-[#475569]">Keyword Density</span> · <span className="text-[#475569]">Title Alignment</span> · <span className="text-[#475569]">Experience Match</span>
              </p>
            </div>
          </div>

          {/* ATS Systems */}
          {record.atsCompatibility && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#475569] mb-4">ATS Compatibility</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Taleo', score: record.atsCompatibility.taleo },
                  { name: 'Workday', score: record.atsCompatibility.workday },
                  { name: 'Greenhouse', score: record.atsCompatibility.greenhouse },
                  { name: 'Lever', score: record.atsCompatibility.lever },
                ].map((ats) => {
                  const color = ats.score >= 70 ? 'text-green-400' : ats.score >= 45 ? 'text-yellow-400' : 'text-red-400';
                  const bar = ats.score >= 70 ? 'bg-green-500' : ats.score >= 45 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={ats.name} className="rounded-xl bg-white/[0.03] border border-white/6 p-3">
                      <p className="text-[#475569] text-[10px] font-medium mb-1">{ats.name}</p>
                      <p className={`text-xl font-black tabular-nums ${color}`}>{ats.score}%</p>
                      <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${bar}`} style={{ width: `${ats.score}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Score Breakdown Bars */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#475569] mb-4">Score Breakdown</p>
            <div className="space-y-4">
              {[
                { label: 'Parsability', before: record.scoreBreakdown?.format_score?.before ?? 0, after: record.scoreBreakdown?.format_score?.after ?? 0 },
                { label: 'Keyword Density', before: record.scoreBreakdown?.keyword_density?.before ?? 0, after: record.scoreBreakdown?.keyword_density?.after ?? 0 },
                { label: 'Title Alignment', before: record.scoreBreakdown?.bullet_impact?.before ?? 0, after: record.scoreBreakdown?.bullet_impact?.after ?? 0 },
                { label: 'Experience Match', before: record.scoreBreakdown?.skills_alignment?.before ?? 0, after: record.scoreBreakdown?.skills_alignment?.after ?? 0 },
              ].map((item) => (
                <ScoreBar key={item.label} {...item} getBarColor={getBarColor} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {planFeatures.canGenerateCoverLetter ? (
              <button
                onClick={handleGenerateCoverLetter}
                disabled={generatingCover}
                className="w-full relative overflow-hidden flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold
                  bg-gradient-to-r from-purple-600 to-purple-700 text-white border border-purple-500/30
                  hover:from-purple-500 hover:to-purple-600 transition-all duration-200 shadow-lg shadow-purple-900/30
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail size={15} />
                {generatingCover ? 'Generating...' : 'Generate Cover Letter'}
              </button>
            ) : (
              <button
                onClick={() => { setUpgradePlan('starter'); setShowUpgradeModal(true); }}
                className="w-full flex items-center justify-center gap-2 border border-white/8 text-white/30 px-4 py-3 rounded-xl cursor-not-allowed relative hover:border-purple-500/20 transition-colors text-sm group"
              >
                <Lock size={14} className="text-purple-400/60 group-hover:text-purple-400 transition-colors" />
                Generate Cover Letter
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-lg">
                  Starter
                </span>
              </button>
            )}

            <Link
              to="/optimize"
              className="w-full flex items-center justify-center gap-2 text-sm text-[#475569] hover:text-white border border-white/8 hover:border-white/15 px-4 py-2.5 rounded-xl transition-all"
            >
              <ArrowLeft size={13} />
              Optimize Another
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── Cover Letter (full width) ── */}
      <AnimatePresence>
        {showCoverLetter && coverLetter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6"
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Mail size={12} className="text-purple-400" />
                </div>
                <h3 className="text-white font-bold text-sm">Cover Letter</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => { await navigator.clipboard.writeText(coverLetter); toast('Cover letter copied!', 'success'); }}
                  className="text-[#64748b] hover:text-white text-xs flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30"
                >
                  <Copy size={12} /> Copy
                </button>
                <DownloadCoverLetterButton
                  coverLetterText={coverLetter}
                  resumeText={record.optimizedResume}
                  jobTitle={record.targetRole || 'the Position'}
                  companyName={record.targetCompany}
                  candidateName={record.candidateName}
                  className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all disabled:opacity-50"
                />
              </div>
            </div>
            <pre className="text-[#cbd5e1] text-sm leading-relaxed whitespace-pre-wrap font-mono bg-black/20 p-5 rounded-xl">
              {coverLetter}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredPlan={upgradePlan}
        featureName={upgradePlan === 'starter' ? 'Premium Features Locked' : 'Advanced Features Locked'}
      />
    </motion.div>
  );
}
