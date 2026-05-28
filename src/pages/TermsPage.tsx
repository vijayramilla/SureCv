import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Scale } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1a1d3a]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#0f172a]/80 backdrop-blur-md z-40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-brand-purple">
            SureCv
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-[#94a3b8] hover:text-white transition">
              Home
            </Link>
            <Link to="/privacy" className="text-[#94a3b8] hover:text-white transition">
              Privacy
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="text-brand-purple" size={32} />
              <h1 className="text-5xl font-bold text-white">Terms of Service</h1>
            </div>
            <p className="text-[#94a3b8]">Last updated: May 2024</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-invert max-w-none space-y-8"
          >
            {/* Agreement to Terms */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                By accessing and using SureCv, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            {/* Use License */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-3">
                Permission is granted to temporarily download one copy of the materials (information or software) on SureCv for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-[#94a3b8] space-y-2">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile or reverse engineer any software contained on SureCv</li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
                <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              </ul>
            </div>

            {/* Disclaimer */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Disclaimer</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                The materials on SureCv are provided "as is". SureCv makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </div>

            {/* Limitations */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Limitations</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                In no event shall SureCv or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SureCv, even if SureCv or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </div>

            {/* Accuracy of Materials */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Accuracy of Materials</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                The materials appearing on SureCv could include technical, typographical, or photographic errors. SureCv does not warrant that any of the materials on its website are accurate, complete, or current. SureCv may make changes to the materials contained on its website at any time without notice.
              </p>
            </div>

            {/* Materials and Content */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Materials and Content</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                SureCv has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by SureCv of the site. Use of any such linked website is at the user's own risk.
              </p>
            </div>

            {/* Modifications */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">7. Modifications</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                SureCv may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </div>

            {/* Governing Law */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">8. Governing Law</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </div>

            {/* User Accounts */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">9. User Accounts</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                If you create an account on SureCv, you are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password. You agree to notify SureCv immediately of any unauthorized use of your account or any other breaches of security.
              </p>
            </div>

            {/* Intellectual Property Rights */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">10. Intellectual Property Rights</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                All content on SureCv, including but not limited to text, graphics, logos, images, and software, is the property of SureCv or its content suppliers and is protected by international copyright laws. You may not reproduce, distribute, or transmit any content without our prior written permission.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-3">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <p className="text-white font-semibold mb-2">Email:</p>
                <a href="mailto:vjramx@gmail.com" className="text-brand-purple hover:text-brand-purple/80 transition">
                  vjramx@gmail.com
                </a>
              </div>
            </div>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 pt-8 border-t border-white/10 text-center"
          >
            <p className="text-[#94a3b8] mb-4">Other pages:</p>
            <div className="flex items-center justify-center gap-6">
              <Link to="/" className="text-brand-purple hover:text-brand-purple/80 transition font-semibold">
                Home
              </Link>
              <Link to="/privacy" className="text-brand-purple hover:text-brand-purple/80 transition font-semibold">
                Privacy
              </Link>
              <Link to="/contact" className="text-brand-purple hover:text-brand-purple/80 transition font-semibold">
                Contact
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
