import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Gift } from 'lucide-react';

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

interface HeroProps {
  onTrySample: (resume: string) => void;
}

// TEST COMMENT TO CHECK FILE CHANGES

export default function Hero({ onTrySample }: HeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const handleTrySample = () => {
    onTrySample(SAMPLE_RESUME);
    document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.18)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse,rgba(13,27,42,0.8)_0%,transparent_70%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left content */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center lg:text-left">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-brand-purple text-xs font-semibold mb-6 tracking-wide uppercase">
            <Zap size={12} />
            Intelligence-Powered Resume Optimizer
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6">
            <span className="text-white">The Resume</span>
            <br />
            <span className="text-gradient">Builder that gets</span>
            <br />
            <span className="text-white">you hired</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="section-subtext text-lg max-w-lg mx-auto lg:mx-0 mb-8">
            Check your ATS score and rewrite your resume with exact keyword matching in under 30 seconds
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
            <a href="#tool" className="btn-primary text-base px-7 py-3.5">
              Improve My Resume
              <ArrowRight size={18} />
            </a>
            <button onClick={handleTrySample} className="btn-outline text-base px-7 py-3.5">
              Try with Sample Resume
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center lg:justify-start">
            {[
              { icon: ShieldCheck, label: 'No data sold' },
              { icon: Zap, label: '~20s results' },
              { icon: Gift, label: 'Free to start' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[#94a3b8] text-sm">
                <Icon size={14} className="text-brand-purple" />
                {label}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: animated before/after preview */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="hidden lg:flex flex-col gap-4 relative"
        >
          {/* Glow behind cards */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse,rgba(124,58,237,0.2)_0%,transparent_70%)] pointer-events-none" />

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="glass-card p-5 relative"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Before</span>
              <span className="score-badge bg-red-500/20 border border-red-500/30 text-red-400 text-sm w-12 h-12">34</span>
            </div>
            <p className="text-sm text-[#94a3b8] font-semibold mb-2">Teju</p>
            <p className="text-xs text-[#64748b] mb-4">teju@gmail.com | linkedin.com/in/teju</p>
            <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-1">Experience</p>
            <p className="text-xs text-[#64748b] font-medium mb-2">Software Developer — TechSoft India</p>
            <p className="text-xs text-[#64748b] mb-3">- Worked on some projects</p>
            <div className="mt-3 flex gap-1.5 flex-wrap">
              <span className="keyword-tag keyword-missing text-xs">❌ React</span>
              <span className="keyword-tag keyword-missing text-xs">❌ CI/CD</span>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="glass-card p-5 border-brand-purple/30 relative"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">After</span>
              <span className="score-badge bg-green-500/20 border border-green-500/30 text-green-400 text-sm w-12 h-12">91</span>
            </div>
            <div className="text-sm space-y-3">
              <div>
                <p className="font-semibold text-white">Teju</p>
                <p className="text-xs text-[#94a3b8]">teju@gmail.com | linkedin.com/in/teju</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-white uppercase tracking-wide mb-1.5">Experience</p>
                <p className="text-xs text-white font-medium">Software Developer — TechSoft India</p>
                <ul className="text-xs text-[#e2e8f0] mt-1.5 space-y-1">
                  <li>- Architected 3 React dashboards reducing load time by 45%</li>
                  <li>- Automated CI/CD pipeline cutting deployment time by 60%</li>
                  <li>- Resolved 120+ bugs improving system stability by 35%</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-white uppercase tracking-wide mb-1.5">Skills</p>
              </div>
            </div>
            <div className="mt-2 flex gap-1.5 flex-wrap">
              <span className="keyword-tag keyword-added text-xs">+ React</span>
              <span className="keyword-tag keyword-added text-xs">+ CI/CD</span>
              <span className="keyword-tag keyword-added text-xs">+ Node.js</span>
              <span className="keyword-tag keyword-added text-xs">+ AWS</span>
            </div>
          </motion.div>

          <div className="absolute -top-2 -right-2 w-20 h-20 bg-[radial-gradient(ellipse,rgba(124,58,237,0.4)_0%,transparent_70%)] animate-pulse-slow" />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[#475569] text-xs">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 rounded-full border border-white/10 flex items-center justify-center"
        >
          <div className="w-1 h-2 bg-brand-purple rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
