import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, AlertCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { analyzeResume, type AnalysisResult } from '../lib/nvidia-nim';
import { downloadPremiumResumePdf } from '../lib/premiumPdfDownload';
import ScoreCounter from './ScoreCounter';
import { useInView } from '../hooks/useInView';

interface ToolSectionProps {
  initialResume?: string;
}

export default function ToolSection({ initialResume = '' }: ToolSectionProps) {
  const [resume, setResume] = useState(initialResume);

  useEffect(() => {
    if (initialResume) setResume(initialResume);
  }, [initialResume]);
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showBefore, setShowBefore] = useState(true);
  const [ref, inView] = useInView({ threshold: 0.1 });

  const handleAnalyze = async () => {
    if (!resume.trim() || !jobDesc.trim()) {
      setError('Please fill in both your resume and the job description.');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const data = await analyzeResume(resume, jobDesc);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.rewrittenResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      await downloadPremiumResumePdf({ resumeText: result.rewrittenResume });
    } catch {
      setError('PDF download failed. Please try again.');
    }
  };

  return (
    <section id="tool" className="py-24 relative" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(124,58,237,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-brand-purple text-xs font-semibold mb-4 tracking-wide uppercase">
            <Sparkles size={12} />
            Deep Resume Intelligence
          </div>
          <h2 className="section-heading mb-4">Analyze & Improve Your Resume</h2>
          <p className="section-subtext max-w-xl mx-auto">
            Paste your resume and the job description — our proprietary engine handles the rest in seconds
          </p>
        </motion.div>

        {/* Input panels */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid lg:grid-cols-2 gap-5 mb-6"
        >
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-white font-semibold text-sm">Your Resume</label>
              <span className="text-[#475569] text-xs">{resume.length} chars</span>
            </div>
            <textarea
              className="textarea-dark h-64"
              placeholder="Paste your resume text here...&#10;&#10;Include your name, experience, skills, and education."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-white font-semibold text-sm">Job Description</label>
              <span className="text-[#475569] text-xs">{jobDesc.length} chars</span>
            </div>
            <textarea
              className="textarea-dark h-64"
              placeholder="Paste the job description here...&#10;&#10;Include required skills, responsibilities, and qualifications."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 mb-5 text-red-400 text-sm"
            >
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analyze button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-8"
        >
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="btn-primary text-base px-10 py-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running Deep Analysis...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze & Improve
              </>
            )}
          </button>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Score + missing keywords */}
              <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="text-center">
                    <p className="text-[#94a3b8] text-sm mb-3 font-medium">ATS Match Score</p>
                    <ScoreCounter target={result.score} />
                  </div>

                  <div className="flex-1 w-full">
                    <p className="text-[#94a3b8] text-sm mb-3 font-medium">
                      Missing Keywords <span className="text-[#475569]">({result.missingKeywords.length})</span>
                    </p>
                    {result.missingKeywords.length === 0 ? (
                      <p className="text-green-400 text-sm font-medium">No critical keywords missing!</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {result.missingKeywords.map((kw) => (
                          <span key={kw} className="keyword-tag keyword-missing">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Before / After comparison */}
              <div className="grid lg:grid-cols-2 gap-5">
                {/* Before */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-white font-semibold text-sm">Original Resume</span>
                    </div>
                    <button
                      className="text-[#475569] hover:text-white text-xs flex items-center gap-1 transition-colors"
                      onClick={() => setShowBefore(!showBefore)}
                    >
                      {showBefore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {showBefore ? 'Collapse' : 'Expand'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {showBefore && (
                      <motion.pre
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[#94a3b8] text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-80 overflow-y-auto pr-1 scrollbar-thin"
                      >
                        {resume}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </div>

                {/* After */}
                <div className="glass-card p-5 border-brand-purple/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-white font-semibold text-sm">Optimized Resume</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="text-[#475569] hover:text-white text-xs flex items-center gap-1 transition-colors"
                      >
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <pre className="text-[#e2e8f0] text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-80 overflow-y-auto pr-1">
                    {result.rewrittenResume}
                  </pre>
                </div>
              </div>

              {/* Download button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center"
              >
                <button onClick={handleDownload} className="btn-primary text-base px-8 py-3.5 gap-2">
                  <Download size={18} />
                  Download Improved Resume as PDF
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
