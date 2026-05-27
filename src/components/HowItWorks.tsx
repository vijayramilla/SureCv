import { motion } from 'framer-motion';
import { Upload, Brain, Download } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your Resume',
    description: 'Paste your resume text or upload a PDF. Our system extracts all relevant information instantly.',
  },
  {
    number: '02',
    icon: Brain,
    title: 'Deep Analysis & Rewrites',
    description: 'SureCV Intelligence scores your ATS match, identifies missing keywords, and rewrites every bullet with impact.',
  },
  {
    number: '03',
    icon: Download,
    title: 'Download & Apply',
    description: 'Get your optimized resume as a PDF. Apply with confidence knowing your ATS score will pass filters.',
  },
];

export default function HowItWorks() {
  const [ref, inView] = useInView({ threshold: 0.15 });

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-brand-purple text-xs font-semibold mb-4 tracking-wide uppercase">
            Simple Process
          </div>
          <h2 className="section-heading mb-4">How It Works</h2>
          <p className="section-subtext max-w-xl mx-auto">
            Three steps to transform your resume from overlooked to shortlisted
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-brand-purple/30 to-transparent" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="glass-card p-8 text-center relative group"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-purple rounded-full text-xs font-bold text-white">
                Step {step.number}
              </div>

              <div className="w-14 h-14 bg-brand-purple/15 border border-brand-purple/25 rounded-2xl flex items-center justify-center mx-auto mb-5 mt-3 group-hover:bg-brand-purple/25 transition-colors duration-300">
                <step.icon size={24} className="text-brand-purple" />
              </div>

              <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
