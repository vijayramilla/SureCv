import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Loader2,
  Mail,
} from 'lucide-react'
import type { EnrichedOptimizeResult } from '../../lib/scoreData'
import type { AtsScoreData } from '../../lib/atsScoreTypes'
import { DIMENSION_LABELS } from '../../lib/atsScoreTypes'
import { parseResumeText } from '../../lib/parseResumeText'
import { ScoreRing } from './ScoreRing'
import { ResumePaperPreview } from './ResumePaperPreview'
import { OptimizeResumePdfPreview } from './OptimizeResumePdfPreview'
import { generateResumeDocx } from '../../lib/generateResumeDocx'
import { downloadPremiumResumePdf } from '../../lib/premiumPdfDownload'
import { generateCoverLetter } from '../../lib/aiOptimization'
import { DownloadCoverLetterButton } from '../CoverLetterPDF'
import { useToast } from '../../contexts/ToastContext'
import { usePlanFeatures } from '../../hooks/usePlanFeatures'

interface OptimizeResultsLayoutProps {
  result: EnrichedOptimizeResult
  atsData: AtsScoreData | null
  originalResume?: string
  jobDescription?: string
  onReset: () => void
}

export default function OptimizeResultsLayout({
  result,
  atsData,
  originalResume = '',
  jobDescription = '',
  onReset,
}: OptimizeResultsLayoutProps) {
  const toast = useToast()
  const planFeatures = usePlanFeatures()
  const [copied, setCopied] = useState(false)
  const [keywordsOpen, setKeywordsOpen] = useState(true)
  const [verbsOpen, setVerbsOpen] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [downloadingDocx, setDownloadingDocx] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [generatingCover, setGeneratingCover] = useState(false)
  const [showCoverLetter, setShowCoverLetter] = useState(false)

  const resumeText = result.rewrittenResume || ''
  const parsed = parseResumeText(resumeText)
  const candidateName = result.candidate_name || parsed.name || 'Resume'
  const jobTitle = result.target_role || 'the Position'
  const companyName = result.target_company || ''

  const before = atsData?.overall_before ?? result.scoreDisplay.before
  const after = atsData?.overall_after ?? result.scoreDisplay.after
  const isOptimal =
    atsData?.is_already_optimal ??
    (!result.scoreDisplay.changesMade ||
      (after >= 85 && after - before <= 3))

  const keywordsMatched =
    atsData?.keywords_matched ?? result.scoreDisplay.keywordsAddedList
  const keywordsMissing =
    atsData?.keywords_missing ?? result.scoreDisplay.keywordsMissingList
  const weakVerbs =
    atsData?.weak_verbs?.map((v) => ({ from: v.original, to: v.replacement })) ??
    result.scoreDisplay.verbsReplaced
  const bulletsRewritten =
    atsData?.bullets_rewritten ?? result.scoreDisplay.bulletsRewritten
  const skillsPct =
    atsData?.skills_match_pct ?? result.scoreDisplay.skillsMatchPct
  const verdict = atsData?.verdict ?? result.scoreDisplay.rubricMessage
  const tips = atsData?.tips ?? result.scoreDisplay.tips
  const analysisMessage = atsData?.verdict ?? result.scoreDisplay.analysisMessage
  const changesMade = !isOptimal && (after > before || bulletsRewritten > 0)

  const keywordsAddedList =
    (Array.isArray(result.keywords_added) ? result.keywords_added : []) as string[]

  const extractBullets = (text: string) =>
    (text || '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^[•\-·*▪▸►]/.test(l) || /^\d+[.)]\s/.test(l))
      .map((l) => l.replace(/^[•\-·*▪▸►]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
      .filter(Boolean)

  const oldBullets = extractBullets(originalResume)
  const newBullets = extractBullets(resumeText)
  const bulletPairs = newBullets.slice(0, 5).map((b, i) => ({
    after: b,
    before: oldBullets[i] || '',
  }))

  const handleCopy = async () => {
    await navigator.clipboard.writeText(resumeText)
    setCopied(true)
    toast('Copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPDF = async () => {
    setGeneratingPdf(true)
    try {
      await downloadPremiumResumePdf({
        resumeText,
        candidateName,
      })
      toast('Premium PDF downloaded!', 'success')
    } catch {
      toast('PDF generation failed. Please try again.', 'error')
    } finally {
      setGeneratingPdf(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!planFeatures.canGenerateCoverLetter) {
      toast('Cover letter generation requires a Starter or Power plan.', 'error')
      return
    }
    if (!jobDescription.trim()) {
      toast('Job description is required to generate a cover letter.', 'error')
      return
    }

    setGeneratingCover(true)
    try {
      const letter = await generateCoverLetter(resumeText, jobDescription, candidateName)
      setCoverLetter(letter)
      setShowCoverLetter(true)
      toast('Cover letter generated!', 'success')
    } catch {
      toast('Failed to generate cover letter', 'error')
    } finally {
      setGeneratingCover(false)
    }
  }

  const handleDownloadDOCX = async () => {
    setDownloadingDocx(true)
    try {
      await generateResumeDocx(resumeText, parsed.name || 'Resume')
      toast('DOCX downloaded!', 'success')
    } catch {
      toast('DOCX download failed', 'error')
    } finally {
      setDownloadingDocx(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-[#1a1a2e] border border-white/10 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
            🏆
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {isOptimal
                ? 'Your resume is already highly optimized!'
                : 'Your resume has been optimized!'}
            </p>
            <p className="text-[#94a3b8] text-xs mt-0.5">
              {isOptimal
                ? 'No meaningful improvements could be made without fabricating experience. Great work!'
                : 'Premium black & white ATS resume PDF ready to download.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-[#0f2e1a] border border-green-500/40 text-green-400 text-sm font-semibold px-4 py-2 rounded-full">
            ATS Score: {after} / 100 ✓
          </div>
          {atsData?.source === 'gemini' && (
            <span className="text-[10px] text-purple-300/80 px-2 py-1 rounded-full border border-purple-500/30">
              Gemini verified
            </span>
          )}
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all"
          >
            ← Start Over
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6 w-full items-stretch">
        {/* Column 1 — Premium preview */}
        <div className="glass-card rounded-2xl flex flex-col min-h-[480px] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <h3 className="text-white font-semibold text-sm">
                {isOptimal ? 'Your Resume (Already Optimal)' : 'Your Optimized Resume'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="text-xs text-[#94a3b8] hover:text-white flex items-center gap-1 transition-colors"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[65vh] p-4 space-y-3">
            <OptimizeResumePdfPreview resumeText={resumeText} />
            <p className="text-[10px] text-center text-[#64748b]">
              Premium ATS-safe layout · Helvetica · Black &amp; white
            </p>
            <details className="text-xs">
              <summary className="text-purple-400 cursor-pointer hover:text-purple-300">
                View full text
              </summary>
              <div className="mt-2 max-h-48 overflow-y-auto">
                <ResumePaperPreview text={resumeText} />
              </div>
            </details>
          </div>

          <div className="flex flex-col gap-2 p-3 border-t border-white/5 shrink-0">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleDownloadPDF()}
                disabled={generatingPdf}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                {generatingPdf ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  '↓'
                )}
                {generatingPdf ? 'Generating…' : 'Download PDF'}
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadDOCX()}
                disabled={downloadingDocx}
                className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 rounded-xl border border-white/10 transition-all disabled:opacity-50"
              >
                {downloadingDocx ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  '↓'
                )}
                {downloadingDocx ? 'Generating…' : 'Download DOCX'}
              </button>
            </div>

            {!showCoverLetter ? (
              <button
                type="button"
                onClick={() => void handleGenerateCoverLetter()}
                disabled={generatingCover}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2.5 rounded-xl border border-white/10 transition-all disabled:opacity-50 w-full"
              >
                {generatingCover ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Mail size={14} />
                )}
                {generatingCover ? 'Writing cover letter…' : 'Generate Cover Letter'}
              </button>
            ) : (
              <DownloadCoverLetterButton
                coverLetterText={coverLetter}
                resumeText={resumeText}
                jobTitle={jobTitle}
                companyName={companyName}
                candidateName={candidateName}
              />
            )}
          </div>
        </div>

        {/* Column 2 — Analysis */}
        <div className="glass-card rounded-2xl flex flex-col min-h-[480px] p-4">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <h3 className="text-white font-semibold text-sm">Why Your Resume Scores High</h3>
          </div>

          {/* What changed (explicit) */}
          <div className="rounded-xl p-4 mb-4 border bg-white/5 border-white/10">
            <p className="text-white text-xs font-semibold mb-2">What changed</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
                Score lift: +{Math.max(0, after - before)}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300">
                Keywords added: {keywordsAddedList.length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                Bullets rewritten: {bulletsRewritten}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                Weak verbs replaced: {weakVerbs.length}
              </span>
            </div>

            {keywordsAddedList.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] text-[#94a3b8] mb-2">Keywords injected</p>
                <div className="flex flex-wrap gap-1.5">
                  {keywordsAddedList.slice(0, 12).map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] rounded-lg"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {bulletPairs.length > 0 && (
              <div>
                <p className="text-[10px] text-[#94a3b8] mb-2">Sample rewritten bullets</p>
                <div className="space-y-2">
                  {bulletPairs.map((p, i) => (
                    <div key={i} className="bg-black/20 border border-white/10 rounded-lg p-2">
                      {p.before ? (
                        <p className="text-[10px] text-[#94a3b8] line-through mb-1">
                          {p.before}
                        </p>
                      ) : null}
                      <p className="text-[10px] text-white">{p.after}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className={`rounded-xl p-4 mb-4 border ${
              changesMade
                ? 'bg-purple-900/20 border-purple-500/30'
                : 'bg-green-900/20 border-green-500/30'
            }`}
          >
            <p className="text-sm text-[#cbd5e1] leading-relaxed">
              <span
                className={`font-semibold ${
                  changesMade ? 'text-purple-400' : 'text-green-400'
                }`}
              >
                {changesMade ? 'Changes applied.' : 'No changes needed.'}
              </span>{' '}
              {analysisMessage}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5 shrink-0">
            {[
              {
                label: 'Keywords\nMatched',
                value: keywordsMatched.length,
                color: 'text-green-400',
              },
              {
                label: 'Bullets\nRewritten',
                value: bulletsRewritten,
                color: 'text-purple-400',
              },
              {
                label: 'Skills\nMatched',
                value: `${skillsPct}%`,
                color: 'text-blue-400',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
              >
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-[#94a3b8] mt-1 whitespace-pre-line">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            <div>
              <button
                type="button"
                onClick={() => setKeywordsOpen(!keywordsOpen)}
                className="w-full flex items-center justify-between text-left mb-2"
              >
                <span className="text-white text-xs font-semibold">Keyword Analysis</span>
                {keywordsOpen ? (
                  <ChevronUp size={14} className="text-[#94a3b8]" />
                ) : (
                  <ChevronDown size={14} className="text-[#94a3b8]" />
                )}
              </button>
              {keywordsOpen && (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-[#64748b] mb-2">Keywords Matched</p>
                    <div className="flex flex-wrap gap-1.5">
                      {keywordsMatched.length === 0 ? (
                        <span className="text-[10px] text-[#94a3b8]">None detected</span>
                      ) : (
                        keywordsMatched.map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] rounded-lg"
                          >
                            {kw}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748b] mb-2">Still Missing</p>
                    <div className="flex flex-wrap gap-1.5">
                      {keywordsMissing.length === 0 ? (
                        <span className="text-[10px] text-green-400">All matched!</span>
                      ) : (
                        keywordsMissing.map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400/90 text-[10px] rounded-lg"
                          >
                            {kw}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {weakVerbs.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setVerbsOpen(!verbsOpen)}
                  className="w-full flex items-center justify-between text-left mb-2"
                >
                  <span className="text-white text-xs font-semibold">Weak Verbs Replaced</span>
                  {verbsOpen ? (
                    <ChevronUp size={14} className="text-[#94a3b8]" />
                  ) : (
                    <ChevronDown size={14} className="text-[#94a3b8]" />
                  )}
                </button>
                {verbsOpen && (
                  <div className="space-y-2">
                    {weakVerbs.slice(0, 8).map((v, i) => (
                      <div key={i} className="flex items-center text-sm">
                        <span className="text-[#94a3b8] line-through">{v.from}</span>
                        <span className="text-[#94a3b8] mx-2">→</span>
                        <span className="text-green-400 font-semibold">{v.to}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Column 3 — ATS Score (Gemini) */}
        <div className="glass-card rounded-2xl flex flex-col min-h-[480px] p-4">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <h3 className="text-white font-semibold text-sm">ATS Score</h3>
          </div>

          <div className="flex items-center justify-between px-2 py-3 shrink-0">
            <ScoreRing score={before} label="Before" />
            <div className="flex flex-col items-center px-2">
              {isOptimal ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-900/30 border border-green-500/40 text-green-400">
                  Already ✓
                </span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/40 text-purple-400">
                  +{after - before}
                </span>
              )}
            </div>
            <ScoreRing score={after} label="After" />
          </div>

          <p className="text-xs text-[#94a3b8] italic text-center mb-4 px-1 shrink-0">
            {verdict}
          </p>

          {atsData?.dimensions && (
            <div className="mb-4 shrink-0 max-h-[200px] overflow-y-auto pr-1">
              {(
                Object.entries(atsData.dimensions) as [
                  keyof typeof atsData.dimensions,
                  { score: number; max: number },
                ][]
              ).map(([key, { score, max }]) => {
                const pct = Math.round((score / max) * 100)
                return (
                  <div key={key} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#94a3b8]">{DIMENSION_LABELS[key]}</span>
                      <span className="text-white font-semibold">
                        {score}/{max}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${pct}%`, transition: 'width 1s ease' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex-1">
            <p className="text-xs text-[#94a3b8] font-semibold tracking-widest uppercase mb-2">
              TIPS
            </p>
            {tips.slice(0, 4).map((tip, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <CheckCircle2
                  size={13}
                  className="text-purple-400 mt-0.5 flex-shrink-0"
                />
                <span className="text-xs text-[#94a3b8]">{tip}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-[#94a3b8]/60 mt-4 shrink-0">
            Have feedback? We read every message and improve
          </p>
        </div>
      </div>
    </motion.div>
  )
}
