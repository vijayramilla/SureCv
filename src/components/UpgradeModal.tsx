import { motion } from 'framer-motion'
import { Lock, ArrowRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PLAN_OPTIMIZATION_LIMITS } from '../constants/plans'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  requiredPlan: 'starter' | 'power'
  featureName: string
  description?: string
}

const planDetails = {
  starter: {
    name: 'Starter',
    price: '₹99',
    period: 'one-time',
    features: [
      `${PLAN_OPTIMIZATION_LIMITS.starter} resume optimizations`,
      'Cover Letter generator',
      'DOCX + PDF export',
      'Job Tracker access',
    ],
  },
  power: {
    name: 'Power',
    price: '₹499',
    period: '/month',
    features: [
      'Unlimited optimizations',
      'Resume History',
      'Job Tracker',
      '5-dimension ATS scoring',
      'Weak verb replacement',
      'Recruiter tips',
      'Priority support',
    ],
  },
}

export default function UpgradeModal({
  isOpen,
  onClose,
  requiredPlan,
  featureName,
  description,
}: UpgradeModalProps) {
  if (!isOpen) return null

  const plan = planDetails[requiredPlan]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 bg-[#0a0a12] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Lock icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-brand-purple/15 rounded-full flex items-center justify-center">
            <Lock size={32} className="text-brand-purple" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white text-center mb-2">
          {featureName}
        </h3>

        {/* Description */}
        <p className="text-center text-[#94a3b8] text-sm mb-6">
          {description || 'This feature requires an upgrade to unlock premium capabilities.'}
        </p>

        {/* Plan details */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold text-white">{plan.price}</span>
            <span className="text-sm text-[#94a3b8]">{plan.period}</span>
          </div>
          <h4 className="font-semibold text-white mb-3">{plan.name} includes:</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[#94a3b8]">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Link
            to="/pricing"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full bg-brand-purple hover:bg-brand-purple/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Upgrade to {plan.name}
            <ArrowRight size={16} />
          </Link>
          <button
            onClick={onClose}
            className="w-full border border-white/10 hover:border-white/20 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </div>
  )
}
