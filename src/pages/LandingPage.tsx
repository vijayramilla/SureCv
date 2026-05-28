import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Zap, ShieldCheck, Target, Tag, PenLine, FileDown, Star, ArrowRight, Gift, Shield, Menu, X, Check, Crown } from 'lucide-react';
import { AI_ENGINE_NAME } from '../constants/branding.js';

const testimonials = [
  {
    name: 'Vijay Ram Illa',
    role: 'Full Stack Developer at SureCv',
    avatar: '/Ram.png',
    before: 31,
    after: 89,
    quote: "SureCv completely transformed my resume. Went from zero callbacks to 3 interviews in one week. The precision rewrites are incredibly accurate!",
  },
  {
    name: 'Keerthan',
    role: 'Senior Engineer at Stripe',
    avatar: '/keerthan.png',
    before: 42,
    after: 88,
    quote: "I was applying for months with no responses. SureCv identified 17 missing keywords I had no idea about.",
  },
  {
    name: 'Sudheer',
    role: 'Data Scientist at Airbnb',
    avatar: '/Sudheer.png',
    before: 28,
    after: 93,
    quote: "The precision rewrites were incredible — they turned my vague bullet points into powerful achievement statements.",
  },
];

const features = [
  { icon: Target, title: 'ATS Score Checker', desc: 'Get an instant 0-100 ATS compatibility score.', color: 'text-blue-400' },
  { icon: Tag, title: 'Keyword Matching', desc: 'Identify every missing keyword from job descriptions.', color: 'text-yellow-400' },
  { icon: PenLine, title: 'Precision Rewrites', desc: 'Precision rewrites with strong action verbs.', color: 'text-purple-400' },
  { icon: FileDown, title: 'PDF Download', desc: 'Export optimized resume as clean PDF.', color: 'text-green-400' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#0a0a12]/95 backdrop-blur-md border-b border-white/5' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-white font-extrabold text-xl">SureCv</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#94a3b8] hover:text-white text-sm font-medium transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-[#94a3b8] hover:text-white text-sm font-medium transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-[#94a3b8] hover:text-white text-sm font-medium transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-[#94a3b8] hover:text-white text-sm font-medium transition-colors">
              Testimonials
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth/login" className="bg-brand-purple hover:bg-brand-purple/90 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              Get Started Free
            </Link>
          </div>

          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[#0a0a12] border-t border-white/5 px-4 py-4 space-y-3"
          >
            <a href="#features" onClick={() => setMenuOpen(false)} className="block text-[#94a3b8] text-sm">Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block text-[#94a3b8] text-sm">How It Works</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="block text-[#94a3b8] text-sm">Pricing</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)} className="block text-[#94a3b8] text-sm">Testimonials</a>
            <Link to="/auth/login" onClick={() => setMenuOpen(false)} className="block w-full bg-brand-purple text-white text-center py-2 rounded-lg text-sm font-semibold">
              Get Started Free
            </Link>
          </motion.div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 via-[#0a0a12] to-purple-900/10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-purple/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-brand-purple text-xs font-semibold mb-6"
            >
              <Zap size={12} />
              Intelligence-Powered Resume Optimizer
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6"
            >
              The Resume Builder
              <br />
              <span className="text-brand-purple">that gets you hired</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-[#94a3b8] mb-8"
            >
              Check your ATS score and rewrite your resume with exact keyword matching in under 30 seconds
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
            >
              <Link to="/auth/login" className="bg-brand-purple hover:bg-brand-purple/90 text-white font-semibold px-6 py-3.5 rounded-lg text-base transition-colors inline-flex items-center justify-center gap-2">
                Improve My Resume
                <ArrowRight size={18} />
              </Link>
              <Link to="/auth/login" className="border border-white/10 hover:border-brand-purple/30 hover:bg-brand-purple/5 text-white font-semibold px-6 py-3.5 rounded-lg text-base transition-colors">
                Try with Sample Resume
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-6 justify-center text-sm text-[#64748b]"
            >
              {[
                { icon: ShieldCheck, label: 'No data sold' },
                { icon: Zap, label: '~20s results' },
                { icon: Gift, label: 'Free to start' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon size={14} className="text-brand-purple" />
                  {label}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Animated demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-4">
              {/* Before card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white/5 border border-white/10 rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Before</span>
                  <span className="px-2 py-1 rounded-full text-xs font-bold text-red-400 bg-red-500/15 border border-red-500/30">34</span>
                </div>
                <p className="font-semibold text-[#94a3b8] mb-1">Natalia</p>
                <p className="text-xs text-[#64748b] mb-3">natalia@gmail.com | linkedin.com/in/natalia</p>
                <p className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wide mb-2">Experience</p>
                <p className="text-xs text-[#64748b] font-medium mb-2">Software Developer — TechSoft India</p>
                <p className="text-xs text-[#64748b] mb-2">- Worked on some projects</p>
                <p className="text-xs text-[#64748b] mb-2">- Fixed bugs in the system</p>
                <p className="text-xs text-[#64748b] mb-3">- Attended team meetings</p>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full">❌ React</span>
                  <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full">❌ CI/CD</span>
                </div>
              </motion.div>

              {/* After card */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="bg-gradient-to-br from-brand-purple/10 to-white/5 border border-brand-purple/20 rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">After</span>
                  <span className="px-2 py-1 rounded-full text-xs font-bold text-green-400 bg-green-500/15 border border-green-500/30">91</span>
                </div>
                <p className="font-semibold text-white mb-1">Natalia</p>
                <p className="text-xs text-[#94a3b8] mb-3">natalia@gmail.com | linkedin.com/in/natalia</p>
                <p className="text-xs text-white font-semibold uppercase tracking-wide mb-2">Experience</p>
                <p className="text-xs text-white font-medium mb-2">Software Developer — TechSoft India</p>
                <p className="text-xs text-[#e2e8f0] mb-2">- Architected 3 React dashboards reducing load time by 45%</p>
                <p className="text-xs text-[#e2e8f0] mb-2">- Automated CI/CD pipeline cutting deployment time by 60%</p>
                <p className="text-xs text-[#e2e8f0] mb-3">- Resolved 120+ bugs improving system stability by 35%</p>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">+ React</span>
                  <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">+ CI/CD</span>
                  <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">+ Node.js</span>
                  <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">+ AWS</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-brand-purple text-xs font-semibold mb-4">
              Simple Process
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-[#94a3b8] max-w-xl mx-auto">
              Three steps to transform your resume from overlooked to shortlisted
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', icon: FileText, title: 'Upload Resume', desc: 'Paste your resume or upload a PDF' },
              { num: '02', icon: Zap, title: 'Deep Analysis', desc: 'SureCV Score and precision rewrites for your resume' },
              { num: '03', icon: FileDown, title: 'Download', desc: 'Get your optimized resume as PDF' },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 text-center"
              >
                <div className="inline-block px-3 py-1 bg-brand-purple/15 border border-brand-purple/30 text-brand-purple rounded-full text-xs font-bold mb-4">
                  Step {step.num}
                </div>
                <div className="w-14 h-14 bg-brand-purple/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <step.icon size={24} className="text-brand-purple" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-[#94a3b8] text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-brand-purple text-xs font-semibold mb-4">
              Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/5 rounded-xl p-6 hover:border-brand-purple/30 transition-colors"
              >
                <feature.icon size={24} className={`${feature.color} mb-4`} />
                <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-[#94a3b8] text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-brand-purple text-xs font-semibold mb-4">
              Success Stories
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Real Results, Real Jobs</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-[#94a3b8] text-sm mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-4">
                  <span className="text-red-400 font-bold">{t.before}</span>
                  <span className="text-[#475569] text-xs">→</span>
                  <span className="text-green-400 font-bold">{t.after}</span>
                </div>
                <div className="flex items-center gap-3">
                  {t.name === 'Vijay Ram Illa' ? (
                    <img 
                      src="/Ram.png"
                      alt="Vijay Ram Illa"
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                      style={{ objectPosition: 'center top' }}
                    />
                  ) : (
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <div>
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    <div className="text-[#64748b] text-xs">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto">
              Choose the plan that works best for you. No hidden fees.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="glass-card p-8 rounded-2xl border border-white/10 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <Zap size={24} className="text-yellow-400" />
                <h3 className="text-2xl font-bold text-white">Free</h3>
              </div>
              <p className="text-[#64748b] mb-6 flex-1">Perfect for trying out</p>
              <div className="mb-8">
                <div className="text-4xl font-bold text-white">₹0</div>
                <p className="text-[#64748b] text-sm">/forever</p>
              </div>
              <Link
                to="/auth/login"
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-colors mb-8 text-center"
              >
                Go Unlimited
              </Link>
              <ul className="space-y-3 text-sm text-[#94a3b8]">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  2 resume optimizations (one-time)
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  2 resumes to create
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  ATS score analysis
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Keyword gap detection
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Basic bullet rewrites
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  PDF export
                </li>
              </ul>
            </motion.div>

            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 rounded-2xl border border-white/10 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <Star size={24} className="text-blue-400" />
                <h3 className="text-2xl font-bold text-white">Starter</h3>
              </div>
              <p className="text-[#64748b] mb-6 flex-1">Job seeker essentials</p>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-4xl font-bold text-white">₹99</div>
                  <div className="text-lg text-[#64748b] line-through">₹299</div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[#64748b] text-sm">/one-time</p>
                  <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded">Save 67%</span>
                </div>
              </div>
              <Link
                to="/auth/login"
                className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-semibold py-3 rounded-lg transition-colors mb-8 text-center"
              >
                Upgrade
              </Link>
              <ul className="space-y-3 text-sm text-[#94a3b8]">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  5 resume optimizations
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Everything in Free
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Cover letter generator
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  DOCX + PDF export
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Job tracker access
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Priority email support
                </li>
              </ul>
            </motion.div>

            {/* Power Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8 rounded-2xl border-2 border-brand-purple bg-gradient-to-br from-brand-purple/10 to-transparent flex flex-col relative"
            >
              <div className="absolute -top-4 left-8 bg-brand-purple text-white text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Crown size={24} className="text-purple-400" />
                <h3 className="text-2xl font-bold text-white">Power</h3>
              </div>
              <p className="text-[#64748b] mb-6 flex-1">For serious job seekers</p>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-4xl font-bold text-white">₹499</div>
                  <div className="text-lg text-[#64748b] line-through">₹799</div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[#64748b] text-sm">/year</p>
                  <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded">Save 38%</span>
                </div>
              </div>
              <Link
                to="/auth/login"
                className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-semibold py-3 rounded-lg transition-colors mb-8 text-center"
              >
                Go Unlimited
              </Link>
              <ul className="space-y-3 text-sm text-[#94a3b8]">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Unlimited optimizations
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Everything in Starter
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  5-dimension ATS scoring
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Weak verb replacement
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Recruiter tips included
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Full history access
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  Early access to features
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-brand-purple to-purple-800 rounded-3xl p-12 text-white"
          >
            <Zap size={32} className="mx-auto mb-4 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to land your dream job?
            </h2>
            <p className="text-purple-100 mb-8">
              Join over 50,000 job seekers who improved their ATS score with SureCv.
            </p>
            <Link to="/auth/login" className="bg-white text-brand-purple font-semibold px-8 py-3.5 rounded-lg hover:bg-purple-50 transition-colors inline-flex items-center gap-2">
              Try SureCv Free
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
