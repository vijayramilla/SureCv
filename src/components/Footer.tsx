import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

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
          </div>

          <nav className="flex flex-wrap justify-center gap-6">
            <Link to="/privacy" className="text-[#94a3b8] hover:text-white text-sm transition-colors duration-200 font-medium">
              Privacy
            </Link>
            <Link to="/terms" className="text-[#94a3b8] hover:text-white text-sm transition-colors duration-200 font-medium">
              Terms
            </Link>
            <Link to="/contact" className="text-[#94a3b8] hover:text-white text-sm transition-colors duration-200 font-medium">
              Contact
            </Link>
          </nav>

          <p className="text-[#64748b] text-sm text-center sm:text-right">
            &copy; 2026 SureCv. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
