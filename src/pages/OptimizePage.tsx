import { useState, useRef } from 'react'
import { fetchSavedResumes, type SavedResumeItem } from '../lib/resumeLibrary'
import { parseApiError } from '../lib/apiErrors'
import OptimizeResultsLayout from '../components/optimize/OptimizeResultsLayout'
import type { EnrichedOptimizeResult } from '../lib/scoreData'
import type { AtsScoreData } from '../lib/atsScoreTypes'
import { calculateFullAtsScore } from '../lib/resumeApi'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Sparkles, Loader2, AlertCircle, FileUp, Link as LinkIcon, Check, Zap, Target, Shield, TrendingUp, PenLine, Hash, CreditCard as Edit, Search, BarChart2, Globe } from 'lucide-react'
import { optimizeResume, type OptimizeResult } from '../lib/aiOptimization'
import { enforceResumeStructure } from '../lib/enforceResumeStructure'
import { extractTextFromPDF } from '../lib/pdfExtractor'
import { fetchJobDescriptionFromUrl } from '../lib/jobUrlFetcher'
import OptimizationLoader, {
  OPTIMIZATION_PHASES,
  getPhaseForProgress,
} from '../components/OptimizationLoader'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { useOptimizations } from '../hooks/useOptimizations'
import { saveResume } from '../lib/storage'
import UpgradeModal from '../components/UpgradeModal'
import { AI_ENGINE_NAME, AI_TAGLINE } from '../constants/branding.js'

const SAMPLE_RESUME = `Alex Johnson
Software Engineer

EXPERIENCE
Software Engineer — Acme Corp (2020–Present)
- Worked on backend systems
- Helped with database tasks
- Participated in code reviews
- Assisted team with various technical tasks

SKILLS
Python, SQL, Some cloud stuff, Git`;

function getSpecificErrorMessage(err: unknown): string {
  return parseApiError(err).userMessage
}

export default function OptimizePage() {
  const [resume, setResume] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [error, setError] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [showSavedResumes, setShowSavedResumes] = useState(false)
  const [savedResumes, setSavedResumes] = useState<SavedResumeItem[]>([])
  const [loadingSavedResumes, setLoadingSavedResumes] = useState(false)
  const [optimizedResult, setOptimizedResult] = useState<EnrichedOptimizeResult | null>(null)
  const [atsData, setAtsData] = useState<AtsScoreData | null>(null)

  // NEW: User instructions
  const [userInstructions, setUserInstructions] = useState('')

  // NEW: Resume length selector
  const [resumeLength, setResumeLength] = useState('auto')

  const pdfInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { canOptimize, useOneCredit, optimizationsLeft } = useOptimizations()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // PDF upload handler
  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setPdfLoading(true)
    setPdfError('')

    try {
      const result = await extractTextFromPDF(file)
      setResume(result.text)
      toast(`PDF extracted! ${result.wordCount} words`, 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to read PDF'
      setPdfError(msg)
      toast(msg, 'error')
    } finally {
      setPdfLoading(false)
      if (event.target) event.target.value = ''
    }
  }

  const fetchJobUrl = async (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return

    setFetchingUrl(true)
    setUrlError('')
    setJobUrl(trimmed)

    try {
      const text = await fetchJobDescriptionFromUrl(trimmed)
      setJobDesc(text)
      toast(`Job description fetched! (${text.split(/\s+/).filter(Boolean).length} words)`, 'success')
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not fetch URL. Run npm run dev:full for Puppeteer, or paste manually.'
      setUrlError(msg)
      toast(msg, 'error')
    } finally {
      setFetchingUrl(false)
    }
  }

  const openSavedResumesModal = async () => {
    if (!user) return
    setShowSavedResumes(true)
    setLoadingSavedResumes(true)
    try {
      const items = await fetchSavedResumes(user.uid, 5)
      setSavedResumes(items)
      if (items.length === 0) {
        toast('No saved resumes yet. Save one in Resume Builder or run an optimization.', 'info')
      }
    } catch {
      toast('Failed to load saved resumes', 'error')
    } finally {
      setLoadingSavedResumes(false)
    }
  }

  const selectSavedResume = (item: SavedResumeItem) => {
    setResume(item.resumeText)
    setShowSavedResumes(false)
    toast(
      item.source === 'builder' ? 'Resume loaded from builder' : 'Resume loaded from history',
      'success'
    )
  }

  // Smart paste detection
  const handleJobDescPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').trim()
    if (pasted.startsWith('http://') || pasted.startsWith('https://')) {
      e.preventDefault()
      toast('URL detected! Fetching with browser engine...', 'info')
      void fetchJobUrl(pasted)
    }
  }

  // Main optimization handler
  const handleAnalyze = async () => {
    if (!resume.trim() || !jobDesc.trim()) {
      setError('Please fill in both your resume and the job description.')
      return
    }

    // Check if in test mode (path contains /test/)
    const isTestMode = window.location.pathname.includes('/test/');

    if (!user && !isTestMode) {
      toast('Please sign in to continue', 'error')
      navigate('/auth/login')
      return
    }

    if (!isTestMode && !canOptimize) {
      setShowUpgradeModal(true)
      return
    }

    setError('')
    setLoading(true)
    setProgress(0)
    setProgressMsg(OPTIMIZATION_PHASES[0].label)

    const startTime = Date.now()
    const totalDuration = 22000

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const baseProgress = Math.min((elapsed / totalDuration) * 95, 95)
      const next = Math.min(baseProgress + Math.random() * 2, 95)

      setProgress(next)
      setProgressMsg(getPhaseForProgress(next).label)
    }, 280)

    try {
      // Enhanced prompt with user instructions and resume length
      let enhancedResume = resume
      let enhancedJD = jobDesc

      if (userInstructions.trim()) {
        enhancedJD += `\n\nAdditional user instructions: ${userInstructions}`
      }

      enhancedJD += `\n\nResume length: ${resumeLength}
 auto = engine decides | 1page = cut ruthlessly | 2page = allow full detail | academic = include publications & research`

      const result = await optimizeResume(enhancedResume, enhancedJD)
      const structuredRewrittenResume = enforceResumeStructure(
        result.rewrittenResume || '',
        result.candidate_name || ''
      )
      const normalizedResult: EnrichedOptimizeResult = {
        ...result,
        rewrittenResume: structuredRewrittenResume,
        optimized_resume: structuredRewrittenResume,
      }
      console.log('=== RAW AI OUTPUT ===', normalizedResult)
      console.log('=== REWRITTEN RESUME ===', normalizedResult.rewrittenResume)

      const fullAts = await calculateFullAtsScore(
        resume,
        normalizedResult.rewrittenResume,
        jobDesc
      )

      // Update normalizedResult with REAL ATS scores from server engine
      // This ensures accurate score calculation instead of NVIDIA estimates
      const finalResult: EnrichedOptimizeResult = {
        ...normalizedResult,
        original_score: fullAts.overall_before,
        optimized_score: fullAts.overall_after,
        score_lift: fullAts.overall_after - fullAts.overall_before,
        atsBefore: fullAts.overall_before,
        atsAfter: fullAts.overall_after,
        // Use real dimension scores from ATS engine
        scoreDimensions: {
          keywordMatch: fullAts.dimensions.keyword_match.score,
          formatScore: fullAts.dimensions.format_parsability.score,
          actionVerbScore: fullAts.dimensions.experience_relevance.score,
          quantifiedBullets: fullAts.dimensions.skills_coverage.score,
          sectionCompleteness: fullAts.dimensions.title_alignment.score,
        },
        // Update keywords and tips from real ATS analysis
        missingKeywords: fullAts.keywords_missing,
        addedKeywords: fullAts.keywords_matched,
        keywords_missing: fullAts.keywords_missing,
        keywords_added: fullAts.keywords_matched,
        recruiterTips: fullAts.tips,
      }

      clearInterval(progressInterval)
      setProgress(100)
      setProgressMsg('Finalizing')

      const isTestMode = window.location.pathname.includes('/test/');

      // Use credit (only if authenticated)
      if (user && !isTestMode) {
        await useOneCredit()
      }

      toast('Resume optimized successfully!', 'success')

      // Save to history (only if authenticated)
      if (user && !isTestMode) {
        saveResume(user.uid, {
          candidateName: result.candidate_name || '',
          targetRole: result.target_role || 'Position',
          targetCompany: result.target_company || 'Company',
          originalScore: fullAts.overall_before,
          optimizedScore: fullAts.overall_after,
          scoreLift: fullAts.overall_after - fullAts.overall_before,
          originalResume: resume,
          optimizedResume: normalizedResult.rewrittenResume,
          keywordsAdded: fullAts.keywords_matched,
          keywordsMissing: fullAts.keywords_missing,
          jobDescription: jobDesc,
        })
      }

      // DEBUG LOGS FOR REWRITING VERIFICATION
      console.log('=== ATS OPTIMIZATION RESULTS ===')
      console.log('BEFORE SCORE:', result.atsBefore)
      console.log('AFTER SCORE:', result.atsAfter)
      console.log('SCORE IMPROVEMENT:', (result.atsAfter || 0) - (result.atsBefore || 0), 'points')
      console.log('BULLETS REWRITTEN:', result.bulletsRewritten)
      console.log('METRICS ADDED:', result.metricsAdded)
      console.log('REWRITTEN PREVIEW:', result.rewrittenResume?.substring(0, 300))
      console.log('WEAK VERBS REPLACED:', result.weakVerbsReplaced)
      console.log('ADDED KEYWORDS:', result.addedKeywords)

      // DEBUG: Show real ATS improvement from server engine
      console.log('=== REAL ATS SCORES (Server Engine) ===')
      console.log('ORIGINAL ATS SCORE:', fullAts.overall_before)
      console.log('OPTIMIZED ATS SCORE:', fullAts.overall_after)
      console.log('ACTUAL IMPROVEMENT:', fullAts.overall_after - fullAts.overall_before, 'points')
      console.log('DIMENSION BREAKDOWN:', fullAts.dimensions)

      setOptimizedResult(finalResult)
      setAtsData(fullAts)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      clearInterval(progressInterval)
      const specificError = getSpecificErrorMessage(err)
      setError(specificError)
      toast(specificError, 'error')
    } finally {
      setLoading(false)
      setProgress(0)
      setProgressMsg('')
    }
  }

  const handleReset = () => {
    setOptimizedResult(null)
    setAtsData(null)
    setResume('')
    setJobDesc('')
    setJobUrl('')
    setUserInstructions('')
    setError('')
    setResumeLength('auto')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSample = () => {
    setResume(SAMPLE_RESUME)
    toast('Sample resume loaded!', 'success')
  }

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      <OptimizationLoader open={loading} progress={progress} />
      {/* Hero Section */}
      {!optimizedResult && (
        <div className="bg-gradient-to-br from-purple-900/30 via-[#0d0d12] to-blue-900/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="text-center mb-8 md:mb-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-purple-600/20 border border-purple-500/30 mb-4 md:mb-6"
              >
                <Zap size={14} className="text-purple-400 md:w-4 md:h-4" />
                <span className="text-purple-300 font-semibold text-xs md:text-sm">{AI_ENGINE_NAME}</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 md:mb-4 px-4"
              >
                World-Class ATS Resume
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Optimization Engine
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[#94a3b8] text-base md:text-lg max-w-3xl mx-auto mb-4 md:mb-6 px-4"
              >
                5-dimension scoring system powered by {AI_TAGLINE.toLowerCase()}.
                Target 80+ ATS score to guarantee human review.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm px-4"
              >
                <div className="flex items-center gap-1.5 md:gap-2 text-green-400">
                  <Check size={14} className="text-green-500 md:w-4 md:h-4" />
                  <span>{optimizationsLeft} free optimizations left</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 text-[#94a3b8]">
                  <Shield size={14} className="text-blue-400 md:w-4 md:h-4" />
                  <span>No data sold</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 text-[#94a3b8]">
                  <Zap size={14} className="text-yellow-400 md:w-4 md:h-4" />
                  <span>~15s results</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {optimizedResult ? (
          <OptimizeResultsLayout
            result={optimizedResult}
            atsData={atsData}
            originalResume={resume}
            jobDescription={jobDesc}
            onReset={handleReset}
          />
        ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="block w-full"
        >
          <div className="w-full">
            <p className="text-[#64748b] text-xs text-center mb-3 lg:hidden">
              Your resume and job description — fill both sections below
            </p>

            {/* Resume + Job Description — side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-4">
            {/* Resume Input */}
            <div className="glass-card p-4 md:p-5 rounded-2xl flex flex-col h-full min-h-[420px] lg:min-h-[480px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-purple-400 md:w-[18px] md:h-[18px]" />
                  <span className="text-white font-bold text-sm">Your Resume</span>
                </div>
                <button
                  onClick={handleSample}
                  className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors"
                >
                  Load Sample
                </button>
              </div>

              <p className="text-[#64748b] text-xs mb-3">
                Paste your resume text or upload a PDF. Our proprietary engine will parse the structure.
              </p>

              <textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your resume text here...&#10;&#10;Make sure to include:&#10;- Your name and contact info&#10;- Work experience with dates&#10;- Skills and technologies&#10;- Education and certifications"
                className="textarea-dark flex-1 min-h-[240px] lg:min-h-[300px] text-sm resize-y"
              />

              <div className="flex items-center gap-2 md:gap-3 mt-3 flex-wrap">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePDFUpload}
                  ref={pdfInputRef}
                  className="hidden"
                />
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={pdfLoading}
                  className="btn-outline text-xs px-3 py-2 md:px-4 md:py-2 flex items-center gap-1.5 md:gap-2 disabled:opacity-50"
                >
                  {pdfLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span className="hidden md:inline">Reading PDF...</span>
                      <span className="md:hidden">Reading...</span>
                    </>
                  ) : (
                    <>
                      <FileUp size={14} />
                      <span>Upload PDF</span>
                    </>
                  )}
                </button>
                <span className="text-[#475569] text-xs hidden sm:inline">
                  {resume.length} characters
                </span>
              </div>

              {pdfError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-3 text-red-400 text-xs">
                  <AlertCircle size={12} />
                  {pdfError}
                </div>
              )}

              {user && (
                <button
                  type="button"
                  onClick={openSavedResumesModal}
                  className="flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#94a3b8] hover:text-white text-sm transition-colors"
                >
                  <FileText size={14} className="text-purple-400" />
                  Use a saved resume
                </button>
              )}
            </div>

            {/* Job Description Input */}
            <div className="glass-card p-4 md:p-5 rounded-2xl flex flex-col h-full min-h-[420px] lg:min-h-[480px]">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon size={16} className="text-blue-400 md:w-[18px] md:h-[18px]" />
                <span className="text-white font-bold text-sm">Job Description</span>
              </div>

              <p className="text-[#64748b] text-xs mb-3">
                Paste the full job posting or paste a URL to auto-fetch. We'll extract all keywords.
              </p>

              <textarea
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                onPaste={handleJobDescPaste}
                placeholder="Paste the job description here...&#10;&#10;Include:&#10;- Job title and company name&#10;- Required and preferred skills&#10;- Responsibilities and qualifications&#10;- Any specific tools or technologies"
                className="textarea-dark flex-1 min-h-[240px] lg:min-h-[300px] text-sm resize-y"
              />

              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                <p className="text-[#64748b] text-xs">Or fetch from a job posting URL:</p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
                    <input
                      type="url"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void fetchJobUrl(jobUrl)
                      }}
                      placeholder="https://careers.company.com/jobs/..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-[#475569] focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => void fetchJobUrl(jobUrl)}
                    disabled={fetchingUrl}
                    className="btn-outline text-xs px-3 md:px-4 py-2 md:py-2.5 disabled:opacity-50 flex items-center gap-1.5 md:gap-2"
                  >
                    {fetchingUrl ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span className="hidden md:inline">Fetching</span>
                      </>
                    ) : (
                      'Fetch'
                    )}
                  </button>
                </div>

                {urlError && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs leading-relaxed">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    {urlError}
                  </div>
                )}

                <p className="text-[#475569] text-[10px] md:text-xs">
                  Works with: LinkedIn, Naukri, Indeed, company career pages, Glassdoor
                </p>
              </div>
            </div>
            </div>

            {/* NEW: User Instructions */}
            <div className="glass-card p-4 md:p-5 mb-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Edit size={16} className="text-purple-400"/>
                <span className="text-sm font-semibold text-white">
                  Anything specific to add or change?
                </span>
                <span className="text-xs text-[#94a3b8] bg-white/5 px-2 py-0.5 rounded-full">optional</span>
              </div>
              <textarea
                value={userInstructions}
                onChange={e => setUserInstructions(e.target.value)}
                placeholder="e.g. 'I led a team of 8 but forgot to add it' · 'Focus on Python and ML' · 'Switching from finance to tech' · 'Remove the 2022 gap'"
                rows={2}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 resize-none outline-none border border-white/10 rounded-lg px-3 py-2 focus:border-purple-500/50 transition-colors"
              />
            </div>

            {/* NEW: Resume Length Selector */}
            <div className="mb-4 md:mb-6">
              <p className="text-xs text-[#94a3b8] font-semibold tracking-widest uppercase text-center mb-3 md:mb-4">
                Resume Length
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {[
                  { id: 'auto', label: 'Auto-detect', sub: 'Let engine decide', icon: Sparkles },
                  { id: '1page', label: '1 Page', sub: 'Fresher / under 5 yrs', icon: FileText },
                  { id: '2page', label: '2 Pages', sub: '5-10+ yrs experience', icon: FileText },
                  { id: 'academic', label: 'Academic CV', sub: 'PhD / research', icon: PenLine },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setResumeLength(opt.id)}
                    className={`p-3 md:p-4 rounded-xl border text-center transition-all ${
                      resumeLength === opt.id
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-[#94a3b8] hover:border-purple-500/50'
                    }`}
                  >
                    <opt.icon size={18} className={`mx-auto mb-1 md:mb-1.5 ${resumeLength === opt.id ? 'text-purple-300' : 'text-[#94a3b8]'}`} />
                    <div className="text-xs md:text-sm font-semibold">{opt.label}</div>
                    <div className="text-[10px] md:text-xs mt-0.5 opacity-70">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            {/* Optimize Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full relative overflow-hidden flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold
                bg-gradient-to-r from-purple-600 to-purple-700 text-white border border-purple-500/30
                hover:from-purple-500 hover:to-purple-600 transition-all duration-200 shadow-lg shadow-purple-900/50
                disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400" />
                  </span>
                  <span className="text-xs md:text-sm">{progressMsg}…</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} className="md:w-5 md:h-5" />
                  Optimize My Resume
                </>
              )}
            </button>

            {/* NEW: Bottom Trust Bar */}
            <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6 gap-y-2 md:gap-y-3 mt-6 text-[10px] md:text-xs text-[#94a3b8]">
              {[
                { icon: Search, text: 'ATS Keyword Analysis' },
                { icon: Sparkles, text: 'Smart Bullet Rewrites' },
                { icon: FileText, text: 'Smart Page Length' },
                { icon: BarChart2, text: 'Before/After Scoring' },
                { icon: Zap, text: '~20 Second Results' },
              ].map(item => (
                <span key={item.text} className="flex items-center gap-1 md:gap-1.5">
                  <item.icon size={12} className="text-purple-400 md:w-[13px] md:h-[13px]"/>
                  {item.text}
                </span>
              ))}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-6 md:mt-8">
              {[
                { icon: Target, label: '5D ATS Scoring', desc: 'Multi-dimensional analysis' },
                { icon: Hash, label: 'Keyword Match', desc: 'Exact JD matching' },
                { icon: PenLine, label: 'Bullet Rewrite', desc: 'Action + X + Y + Z' },
                { icon: TrendingUp, label: 'Metrics Added', desc: 'Quantified results' },
              ].map((feature) => (
                <div key={feature.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 md:p-4">
                  <feature.icon size={18} className="text-purple-400 mb-1.5 md:mb-2 md:w-5 md:h-5" />
                  <p className="text-white font-semibold text-xs md:text-sm mb-0.5 md:mb-1">{feature.label}</p>
                  <p className="text-[#64748b] text-[10px] md:text-xs">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredPlan="starter"
        featureName="Premium Features"
        description="Unlock DOCX downloads, cover letter generation, and more optimizations."
      />

      <AnimatePresence>
        {showSavedResumes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSavedResumes(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl w-full max-w-md p-5"
            >
              <h3 className="text-white font-bold mb-4">Use a saved resume</h3>
              {loadingSavedResumes ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-purple-400" />
                </div>
              ) : savedResumes.length === 0 ? (
                <p className="text-[#94a3b8] text-sm text-center py-6">No saved resumes yet.</p>
              ) : (
                <div className="space-y-2">
                  {savedResumes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectSavedResume(item)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      <p className="text-white text-sm font-medium">{item.title}</p>
                      <p className="text-[#94a3b8] text-xs mt-0.5">{item.subtitle}</p>
                      <p className="text-[#64748b] text-[10px] mt-0.5">
                        {item.savedAt?.toLocaleDateString() || 'Saved on this device'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowSavedResumes(false)}
                className="w-full mt-4 py-2 text-sm text-[#94a3b8] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
