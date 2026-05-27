import { motion } from 'framer-motion';
import { Check, Zap, Star, Crown, Sparkles, ArrowRight, Shield, Clock } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlanFeatures } from '../hooks/usePlanFeatures';
import { initiatePayment, getPlanPaymentDetails } from '../lib/razorpay';
import { PLAN_OPTIMIZATION_LIMITS } from '../constants/plans';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'forever',
    description: 'Perfect for trying out',
    features: [
      '2 resume optimizations (one-time)',
      '2 resumes to create',
      'ATS score analysis',
      'Keyword gap detection',
      'Basic bullet rewrites',
      'PDF export',
    ],
    icon: Zap,
    highlighted: false,
    cta: 'Current Plan',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '99',
    originalPrice: '299',
    period: 'one-time',
    description: 'Job seeker essentials',
    features: [
      `${PLAN_OPTIMIZATION_LIMITS.starter} resume optimizations`,
      'Everything in Free',
      'Cover letter generator',
      'DOCX + PDF export',
      'Job tracker access',
      'Priority email support',
    ],
    icon: Star,
    highlighted: false,
    cta: 'Get Started',
  },
  {
    id: 'power',
    name: 'Power',
    price: '499',
    originalPrice: '799',
    period: 'year',
    description: 'For serious job seekers',
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
    icon: Crown,
    highlighted: true,
    cta: 'Go Unlimited',
    badge: 'Most Popular',
  },
];

const faqs = [
  {
    q: 'How does the free plan work?',
    a: 'You get 2 free resume optimizations (one-time). You can also create 2 resumes with the builder. No credit card required.',
  },
  {
    q: 'Can I upgrade or downgrade anytime?',
    a: 'Yes! You can change your plan at any time. For Starter (one-time), credits are added instantly. For Power, your annual subscription starts immediately.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, UPI, net banking, and wallets via Razorpay.',
  },
  {
    q: 'Is my resume data secure?',
    a: 'Absolutely. Your resume data is encrypted and never shared with third parties. You can delete all your data anytime from settings.',
  },
];

export default function PricingPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const planFeatures = usePlanFeatures();

  const handleSelect = async (planId: string) => {
    if (!user) {
      toast('Please log in to upgrade', 'error');
      navigate('/auth/login');
      return;
    }

    if (planId === 'free') {
      toast('You are on the Free plan', 'info');
      navigate('/optimize');
      return;
    }

    if (planId === 'starter' || planId === 'power') {
      try {
        console.log(`🔄 Initiating ${planId} plan payment...`);
        const planDetails = getPlanPaymentDetails(planId);
        if (!planDetails) {
          toast('Invalid plan selected', 'error');
          return;
        }

        console.log('📝 Plan details:', planDetails);
        await initiatePayment({
          ...planDetails,
          userEmail: user.email || 'user@example.com',
          userId: user.uid,
          userName: user.displayName || 'User',
        });
        console.log('✅ Payment initiated');
      } catch (error) {
        console.error('❌ Payment error:', error);
        toast('Failed to initiate payment. Please try again.', 'error');
      }
      return;
    }
  };

  const isCurrentPlan = (planId: string) => {
    return planFeatures.plan === planId;
  };

  const getButtonText = (planId: string) => {
    if (isCurrentPlan(planId)) {
      return 'Current Plan';
    }
    
    // If user is on Free and clicking Starter/Power
    if (planFeatures.plan === 'free') {
      return planId === 'starter' ? 'Get Started →' : 'Go Unlimited →';
    }
    
    // If user is on Starter looking at Power
    if (planFeatures.plan === 'starter' && planId === 'power') {
      return 'Upgrade to Power →';
    }
    
    // If user is on Power looking at Starter (downgrade)
    if (planFeatures.plan === 'power' && planId === 'starter') {
      return 'Downgrade';
    }
    
    return planId === 'starter' ? 'Get Started' : 'Go Unlimited';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-purple/20 to-pink-500/20 border border-brand-purple/30 text-brand-purple text-sm font-semibold mb-6"
        >
          <Sparkles size={14} />
          Pricing Plans
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
          Invest in Your <span className="text-brand-purple">Career</span>
        </h1>
        <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto">
          Start free and upgrade when you need more power. All plans include our intelligence-powered ATS optimizer.
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          <div className="flex items-center gap-2 text-[#64748b] text-sm">
            <Shield size={16} className="text-green-400" />
            <span>Secure payments</span>
          </div>
          <div className="flex items-center gap-2 text-[#64748b] text-sm">
            <Clock size={16} className="text-blue-400" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2 text-[#64748b] text-sm">
            <Check size={16} className="text-brand-purple" />
            <span>No hidden fees</span>
          </div>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-2xl p-6 flex flex-col ${
              plan.highlighted
                ? 'bg-gradient-to-b from-brand-purple/20 to-brand-purple/5 border-2 border-brand-purple/40 shadow-purple-glow'
                : 'glass-card'
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-brand-purple to-pink-500 rounded-full text-xs font-bold text-white shadow-lg">
                {plan.badge}
              </div>
            )}

            {/* Icon & name */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  plan.highlighted
                    ? 'bg-brand-purple/30 text-white'
                    : 'bg-white/5 text-[#64748b]'
                }`}
              >
                <plan.icon size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">{plan.name}</h3>
                <p className="text-[#64748b] text-sm">{plan.description}</p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">
                  {plan.price === '0' ? 'Free' : `\u20B9${plan.price}`}
                </span>
                {plan.originalPrice && (
                  <span className="text-[#64748b] text-lg line-through">{`\u20B9${plan.originalPrice}`}</span>
                )}
              </div>
              <span className="text-[#64748b] text-sm">/{plan.period}</span>
              {plan.originalPrice && (
                <div className="mt-1 inline-flex items-center gap-1 text-green-400 text-xs font-medium">
                  <Sparkles size={12} />
                  Save {Math.round((1 - parseInt(plan.price) / parseInt(plan.originalPrice)) * 100)}%
                </div>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-6 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check
                    size={18}
                    className={`shrink-0 mt-0.5 ${plan.highlighted ? 'text-brand-purple' : 'text-green-400'}`}
                  />
                  <span className="text-[#94a3b8]">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            {isCurrentPlan(plan.id) ? (
              <button className="w-full py-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 font-semibold text-sm cursor-default">
                <span className="flex items-center justify-center gap-2">
                  <Check size={16} />
                  Current Plan ✓
                </span>
              </button>
            ) : (
              <button
                onClick={() => handleSelect(plan.id)}
                className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-brand-purple to-pink-500 text-white hover:opacity-90'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {getButtonText(plan.id)}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Compare plans */}
      <div className="glass-card p-8 mb-12">
        <h2 className="text-white font-bold text-xl mb-6 text-center">Compare Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[#64748b] font-medium py-3 px-4">Feature</th>
                <th className="text-center text-white font-medium py-3 px-4">Free</th>
                <th className="text-center text-white font-medium py-3 px-4">Starter</th>
                <th className="text-center text-brand-purple font-medium py-3 px-4">Power</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Resume optimizations', free: '2 total', starter: `${PLAN_OPTIMIZATION_LIMITS.starter} total`, power: 'Unlimited' },
                { feature: 'Resumes to create', free: '2', starter: 'Unlimited', power: 'Unlimited' },
                { feature: 'ATS score analysis', free: true, starter: true, power: true },
                { feature: 'Keyword gap detection', free: true, starter: true, power: true },
                { feature: 'Bullet point rewrites', free: 'Basic', starter: 'Advanced', power: 'Advanced' },
                { feature: 'Cover letter generator', free: false, starter: true, power: true },
                { feature: 'DOCX export', free: false, starter: true, power: true },
                { feature: 'Job tracker', free: false, starter: true, power: true },
                { feature: 'Recruiter tips', free: false, starter: false, power: true },
                { feature: 'Weak verb replacement', free: false, starter: false, power: true },
                { feature: 'Priority support', free: false, starter: 'Email', power: 'Priority' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-3 px-4 text-[#94a3b8]">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free ? (
                        <Check size={16} className="text-green-400 mx-auto" />
                      ) : (
                        <span className="text-[#475569]">—</span>
                      )
                    ) : (
                      <span className="text-white">{row.free}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.starter === 'boolean' ? (
                      row.starter ? (
                        <Check size={16} className="text-green-400 mx-auto" />
                      ) : (
                        <span className="text-[#475569]">—</span>
                      )
                    ) : (
                      <span className="text-white">{row.starter}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.power === 'boolean' ? (
                      row.power ? (
                        <Check size={16} className="text-brand-purple mx-auto" />
                      ) : (
                        <span className="text-[#475569]">—</span>
                      )
                    ) : (
                      <span className="text-brand-purple font-medium">{row.power}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQs */}
      <div className="mb-12">
        <h2 className="text-white font-bold text-xl mb-6 text-center">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass-card p-5"
            >
              <h3 className="text-white font-medium text-sm mb-2">{faq.q}</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-[#64748b] text-sm mb-4">Ready to land more interviews?</p>
        <Link to="/optimize" className="btn-primary text-sm px-6 py-3 inline-flex items-center gap-2">
          <Sparkles size={16} />
          Start Optimizing Now
        </Link>
      </div>
    </motion.div>
  );
}
