import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Manager',
    company: 'now at Meta',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop',
    before: 34,
    after: 91,
    quote: "Went from score 34 to 91 in 20 seconds! I had 5 interviews the week after updating my resume with SureCv. Absolutely incredible tool.",
  },
  {
    name: 'Keerthan',
    role: 'Senior Software Engineer',
    company: 'now at Stripe',
    avatar: '/keerthan.png',
    before: 42,
    after: 88,
    quote: "I was applying for months with no responses. SureCv identified 17 missing keywords I had no idea about. Got my dream job offer within 3 weeks.",
  },
  {
    name: 'Sudheer',
    role: 'Data Scientist',
    company: 'now at Airbnb',
    avatar: '/Sudheer.png',
    before: 28,
    after: 93,
    quote: "The precision rewrites were incredible — they turned my vague bullet points into powerful achievement statements. My resume finally reflects what I actually do.",
  },
];

export default function Testimonials() {
  const [ref, inView] = useInView({ threshold: 0.1 });

  return (
    <section className="py-24 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(124,58,237,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-brand-purple text-xs font-semibold mb-4 tracking-wide uppercase">
            Success Stories
          </div>
          <h2 className="section-heading mb-4">Real Results, Real Jobs</h2>
          <p className="section-subtext max-w-xl mx-auto">
            Join thousands of professionals who landed their dream jobs with SureCv
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-card p-6 flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#94a3b8] text-sm leading-relaxed flex-1">"{t.quote}"</p>

              {/* Score badge */}
              <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/3 border border-white/6">
                <div className="flex items-center gap-1.5">
                  <span className="text-red-400 font-bold text-lg">{t.before}</span>
                  <span className="text-[#475569] text-xs">before</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-red-500/40 to-green-500/40" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[#475569] text-xs">after</span>
                  <span className="text-green-400 font-bold text-lg">{t.after}</span>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-1">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-brand-purple/30"
                />
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-[#475569] text-xs">{t.role} — {t.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
