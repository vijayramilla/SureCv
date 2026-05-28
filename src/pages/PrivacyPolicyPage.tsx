import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
            <Link to="/contact" className="text-[#94a3b8] hover:text-white transition">
              Contact
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-brand-purple" size={32} />
              <h1 className="text-5xl font-bold text-white">Privacy Policy</h1>
            </div>
            <p className="text-[#94a3b8]">Last updated: May 2024</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-invert max-w-none space-y-8"
          >
            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                Welcome to SureCv ("we," "us," "our," or "Company"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise handle your information when you use our website, mobile application, and related services (collectively, the "Service").
              </p>
            </div>

            {/* Information We Collect */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#94a3b8] mb-2">2.1 Information You Provide Directly:</h3>
                  <ul className="list-disc list-inside text-[#94a3b8] space-y-2">
                    <li>Account registration information (name, email, password)</li>
                    <li>Resume and job description content you upload</li>
                    <li>Payment information (processed securely through third-party providers)</li>
                    <li>Profile information and preferences</li>
                    <li>Communications with our support team</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#94a3b8] mb-2">2.2 Information Collected Automatically:</h3>
                  <ul className="list-disc list-inside text-[#94a3b8] space-y-2">
                    <li>Device information (IP address, browser type, operating system)</li>
                    <li>Usage data (pages visited, time spent, interactions)</li>
                    <li>Cookies and similar tracking technologies</li>
                    <li>Location data (if permitted)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-[#94a3b8] space-y-2">
                <li>Provide and improve our Service</li>
                <li>Process transactions and send related information</li>
                <li>Send marketing and promotional communications (with your consent)</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Monitor and analyze trends and usage</li>
                <li>Detect, investigate, and prevent fraudulent activities</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            {/* Data Security */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure.
              </p>
            </div>

            {/* Your Rights */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Your Privacy Rights</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-3">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc list-inside text-[#94a3b8] space-y-2">
                <li>Right to access your personal data</li>
                <li>Right to correct inaccurate data</li>
                <li>Right to request deletion of your data</li>
                <li>Right to opt-out of marketing communications</li>
                <li>Right to data portability</li>
              </ul>
            </div>

            {/* Third-Party Services */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Third-Party Services</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                Our Service may contain links to third-party websites and services. We are not responsible for the privacy practices of these external sites. Please review their privacy policies before providing any personal information.
              </p>
            </div>

            {/* Cookies */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience. You can control cookie settings through your browser preferences.
              </p>
            </div>

            {/* Children's Privacy */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                SureCv is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
              </p>
            </div>

            {/* Changes to This Policy */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </div>

            {/* Contact Us */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-3">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
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
