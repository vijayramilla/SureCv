import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useInView } from '../hooks/useInView';

export default function CTABanner() {
  const [ref, inView] = useInView({ threshold: 0.3 });

  return (
    <section className="py-20 relative overflow-hidden" ref={ref}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="relative glass-card p-12 text-center overflow-hidden"
        >
          {/* Decorative glows */}
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-brand-purple/15 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="w-14 h-14 bg-brand-purple/20 border border-brand-purple/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles size={26} className="text-brand-purple" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to land your<br />
              <span className="text-gradient">dream job?</span>
            </h2>

            <p className="text-[#94a3b8] text-lg mb-8 max-w-lg mx-auto">
              Join over 50,000 job seekers who improved their ATS score and got more interviews with SureCv.
            </p>

            <a href="#tool" className="btn-primary text-base px-8 py-4 inline-flex">
              Try SureCv Free
              <ArrowRight size={18} />
            </a>

            <p className="text-[#475569] text-xs mt-5">No credit card required. Results in under 30 seconds.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
