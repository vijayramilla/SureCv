import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export const OPTIMIZATION_PHASES = [
  { at: 0, label: 'Creating', detail: 'Structuring your resume foundation' },
  { at: 18, label: 'Analyzing', detail: 'Mapping job description keywords' },
  { at: 38, label: 'Improving', detail: 'Rewriting bullets for impact' },
  { at: 58, label: 'Optimizing', detail: 'Injecting ATS-matched terms' },
  { at: 78, label: 'Perfecting', detail: 'Polishing tone and metrics' },
  { at: 92, label: 'Finalizing', detail: 'Preparing your premium result' },
] as const

export function getPhaseForProgress(progress: number) {
  let current = OPTIMIZATION_PHASES[0]
  for (const phase of OPTIMIZATION_PHASES) {
    if (progress >= phase.at) current = phase
  }
  return current
}

interface OptimizationLoaderProps {
  open: boolean
  progress: number
}

export default function OptimizationLoader({ open, progress }: OptimizationLoaderProps) {
  const phase = getPhaseForProgress(progress)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Optimizing resume"
        >
          <div className="absolute inset-0 bg-[#050508]/85 backdrop-blur-xl" />

          {/* Ambient glow orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.55, 0.35] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-purple-600/40 blur-[100px]"
            />
            <motion.div
              animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.45, 0.25] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-500/30 blur-[120px]"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-purple-500/20"
            />
          </div>

          <motion.div
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="relative w-full max-w-md rounded-3xl border border-purple-500/40 bg-gradient-to-b from-[#1a1030]/95 to-[#0d0818]/98 p-8 shadow-[0_0_80px_rgba(147,51,234,0.45)]"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 via-transparent to-fuchsia-500/10 pointer-events-none" />

            <div className="relative flex flex-col items-center text-center">
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(168,85,247,0.5)',
                    '0 0 60px rgba(192,132,252,0.8)',
                    '0 0 30px rgba(168,85,247,0.5)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center mb-6 border border-purple-300/30"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
              </motion.div>

              <p className="text-[10px] uppercase tracking-[0.35em] text-purple-300/90 font-semibold mb-2">
                SureCV Intelligence
              </p>

              <AnimatePresence mode="wait">
                <motion.h2
                  key={phase.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-fuchsia-200 mb-2"
                >
                  {phase.label}…
                </motion.h2>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.p
                  key={phase.detail}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-purple-200/70 mb-8 min-h-[1.25rem]"
                >
                  {phase.detail}
                </motion.p>
              </AnimatePresence>

              {/* Progress ring */}
              <div className="relative w-28 h-28 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="rgba(147,51,234,0.2)"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="url(#purpleGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={264}
                    animate={{ strokeDashoffset: 264 - (264 * progress) / 100 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white tabular-nums">
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                {OPTIMIZATION_PHASES.map((p) => {
                  const active = phase.label === p.label
                  return (
                    <span
                      key={p.label}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-all duration-300 ${
                        active
                          ? 'border-purple-400/60 bg-purple-500/25 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                          : 'border-white/10 bg-white/5 text-white/40'
                      }`}
                    >
                      {p.label}
                    </span>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
