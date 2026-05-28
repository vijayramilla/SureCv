import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Try It Free', href: '#tool' },
  ];

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0b0b1e]/90 backdrop-blur-md border-b border-white/5 shadow-xl' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center shadow-purple-glow transition-transform group-hover:scale-110">
            <FileText size={16} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">SureCv</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[#94a3b8] hover:text-white text-sm font-medium transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="#tool" className="btn-primary text-sm px-5 py-2.5">
            Get Started Free
          </a>
        </div>

        <button
          className="md:hidden text-[#94a3b8] hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#0d1020]/95 backdrop-blur-md border-b border-white/5 px-4 py-4 flex flex-col gap-4"
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-[#94a3b8] hover:text-white text-sm font-medium transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
          <a href="#tool" onClick={() => setMenuOpen(false)} className="btn-primary text-sm text-center justify-center">
            Get Started Free
          </a>
        </motion.div>
      )}
    </motion.header>
  );
}
