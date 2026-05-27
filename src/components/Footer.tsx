import { FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-purple rounded-lg flex items-center justify-center">
                <FileText size={14} className="text-white" />
              </div>
              <span className="text-white font-extrabold text-lg">SureCv</span>
            </div>
            <p className="text-[#475569] text-xs">Built on state-of-the-art language technology</p>
          </div>

          <nav className="flex flex-wrap justify-center gap-6">
            {['Privacy', 'Terms', 'Contact'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[#475569] hover:text-[#94a3b8] text-sm transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </nav>

          <p className="text-[#475569] text-xs text-center sm:text-right">
            &copy; 2025 SureCv. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
