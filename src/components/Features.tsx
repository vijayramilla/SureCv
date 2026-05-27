import { motion } from 'framer-motion';
import { Target, Tag, PenLine, FileDown } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const features = [
  {
    icon: Target,
    title: 'ATS Score Checker',
    description: 'Get an instant 0–100 ATS compatibility score showing exactly how well your resume matches any job posting.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Tag,
    title: 'Keyword Matching',
    description: 'Identify every missing keyword from the job description and see which terms are critical for passing ATS filters.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  {
    icon: PenLine,
    title: 'Precision Rewrites',
    description: 'Our proprietary engine rewrites every bullet point with strong action verbs and measurable metrics that impress both ATS and humans.',
    color: 'text-brand-purple',
    bg: 'bg-brand-purple/10 border-brand-purple/20',
  },
  {
    icon: FileDown,
    title: 'PDF Download',
    description: 'Export your optimized resume as a clean, professionally formatted PDF ready to submit to any job application.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
];

export default function Features() {
  const [ref, inView] = useInView({ threshold: 0.1 });

  return (
    <section id="features" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1b2a]/50 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-brand-purple text-xs font-semibold mb-4 tracking-wide uppercase">
            Everything You Need
          </div>
          <h2 className="section-heading mb-4">Powerful Features</h2>
          <p className="section-subtext max-w-xl mx-auto">
            Every tool you need to transform a rejected resume into an interview magnet
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card p-6 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${feature.bg} transition-transform duration-300 group-hover:scale-110`}>
                <feature.icon size={22} className={feature.color} />
              </div>
              <h3 className="text-white font-bold text-base mb-2">{feature.title}</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
