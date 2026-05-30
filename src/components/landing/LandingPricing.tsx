import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Check,
  Zap,
  Star,
  Crown,
  Sparkles,
  Shield,
  ArrowRight,
  Infinity,
} from 'lucide-react'
import { PLAN_OPTIMIZATION_LIMITS } from '../../constants/plans'

const plans = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try the engine',
    price: 0,
    originalPrice: null as number | null,
    period: 'forever',
    icon: Zap,
    accent: 'from-amber-500/20 to-orange-600/5',
    iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    features: [
      '2 resume optimizations (one-time)',
      '2 resumes in the builder',
      'ATS score analysis',
      'Keyword gap detection',
      'Basic bullet rewrites',
      'PDF export',
    ],
    cta: 'Start Free',
    ctaClass:
      'bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:border-white/25',
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Job seeker essentials',
    price: 99,
    originalPrice: 299,
    period: 'one-time',
    icon: Star,
    accent: 'from-blue-500/20 to-cyan-600/5',
    iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    features: [
      `${PLAN_OPTIMIZATION_LIMITS.starter} resume optimizations`,
      'Everything in Free',
      'Cover letter generator',
      'DOCX + PDF export',
      'Job tracker access',
      'Priority email support',
    ],
    cta: 'Get Starter',
    ctaClass:
      'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/25',
    highlighted: false,
  },
  {
    id: 'power',
    name: 'Power',
    tagline: 'For serious job seekers',
    price: 499,
    originalPrice: 799,
    period: 'per year',
    icon: Crown,
    accent: 'from-brand-purple/30 via-fuchsia-500/10 to-violet-600/5',
    iconBg: 'bg-brand-purple/25 border-brand-purple/50 text-brand-purple-light',
    badge: 'Most Popular',
    features: [
      'Unlimited optimizations',
      'Everything in Starter',
      '5-dimension ATS scoring',
      'Weak verb replacement',
      'Recruiter tips included',
      'Full history access',
      'Priority support',
      'Early access to features',
    ],
    cta: 'Go Unlimited',
    ctaClass:
      'bg-gradient-to-r from-brand-purple via-fuchsia-600 to-pink-500 text-white shadow-purple-glow hover:shadow-card-hover hover:scale-[1.02]',
    highlighted: true,
  },
]

function savePercent(price: number, original: number) {
  return Math.round((1 - price / original) * 100)
}

export default function LandingPricing() {
  return (
    <section id="pricing" className="relative py-24 md:py-32 overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-glow opacity-60" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(124,58,237,0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-purple/20 to-fuchsia-500/15 border border-brand-purple/40 text-brand-purple-light text-sm font-semibold mb-6 shadow-purple-glow/50">
            <Sparkles size={14} className="animate-pulse-slow" />
            Premium Plans
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-5">
            Invest in your{' '}
            <span className="bg-gradient-to-r from-white via-purple-200 to-brand-purple-light bg-clip-text text-transparent">
              next role
            </span>
          </h2>
          <p className="text-[#94a3b8] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Start free. Upgrade when you&apos;re ready to land interviews faster — no hidden fees,
            secure payments via Razorpay.
          </p>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-8">
            {[
              { icon: Shield, label: '256-bit secure checkout', color: 'text-emerald-400' },
              { icon: Zap, label: 'Instant credit unlock', color: 'text-amber-400' },
              { icon: Infinity, label: 'Unlimited on Power', color: 'text-brand-purple-light' },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm text-[#64748b]"
              >
                <Icon size={16} className={color} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, i) => {
            const Icon = plan.icon
            const discount =
              plan.originalPrice != null
                ? savePercent(plan.price, plan.originalPrice)
                : null

            return (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                whileHover={{ y: plan.highlighted ? -10 : -6 }}
                className={`relative flex flex-col rounded-3xl p-[1px] ${
                  plan.highlighted
                    ? 'lg:-mt-4 lg:mb-4 z-10'
                    : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-brand-purple via-fuchsia-500 to-pink-500 opacity-80 blur-sm" />
                )}

                <div
                  className={`relative flex flex-col h-full rounded-3xl p-8 md:p-9 bg-gradient-to-b ${plan.accent} backdrop-blur-xl ${
                    plan.highlighted
                      ? 'border border-brand-purple/50 shadow-purple-glow bg-[#12122a]/95'
                      : 'border border-white/10 bg-[#12122a]/90'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-purple via-fuchsia-500 to-pink-500 text-xs font-bold text-white shadow-lg shadow-brand-purple/40">
                        <Crown size={12} />
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <div
                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${plan.iconBg}`}
                      >
                        <Icon size={22} />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      <p className="text-[#64748b] text-sm mt-1">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-end gap-2 flex-wrap">
                      <span className="text-5xl font-extrabold text-white tracking-tight">
                        {plan.price === 0 ? '₹0' : `₹${plan.price}`}
                      </span>
                      {plan.originalPrice != null && (
                        <span className="text-xl text-[#64748b] line-through mb-1">
                          ₹{plan.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[#64748b] text-sm">/{plan.period}</span>
                      {discount != null && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          Save {discount}%
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to="/auth/login"
                    className={`w-full py-3.5 rounded-xl font-semibold text-center text-sm transition-all duration-300 mb-8 ${plan.ctaClass}`}
                  >
                    {plan.cta}
                  </Link>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

                  <ul className="space-y-3.5 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            plan.highlighted
                              ? 'bg-brand-purple/25 text-brand-purple-light'
                              : 'bg-emerald-500/15 text-emerald-400'
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </span>
                        <span className="text-[#94a3b8] leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            )
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-brand-purple-light hover:text-white font-medium text-sm transition-colors group"
          >
            View full plan comparison & FAQs
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </motion.p>
      </div>
    </section>
  )
}
