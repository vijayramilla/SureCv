import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ScoreCounterProps {
  target: number;
  duration?: number;
}

function getScoreColor(score: number) {
  if (score >= 70) return { ring: 'stroke-green-500', text: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' };
  if (score >= 45) return { ring: 'stroke-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' };
  return { ring: 'stroke-red-500', text: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' };
}

function getScoreLabel(score: number) {
  if (score >= 70) return 'Strong Match';
  if (score >= 45) return 'Average Match';
  return 'Weak Match';
}

export default function ScoreCounter({ target, duration = 1500 }: ScoreCounterProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  const colors = getScoreColor(target);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (current / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-75 ${colors.ring}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold ${colors.text}`}>{current}</span>
          <span className="text-[#475569] text-xs font-medium">/100</span>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${colors.bg} ${colors.text}`}>
        {getScoreLabel(target)}
      </div>
    </motion.div>
  );
}
