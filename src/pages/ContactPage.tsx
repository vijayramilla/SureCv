import { motion } from 'framer-motion'
import { Mail, MessageCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ContactPage() {
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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">Get in Touch</h1>
            <p className="text-xl text-[#94a3b8]">
              Have questions about SureCv? We'd love to hear from you. Send us an email and we'll get back to you as soon as possible.
            </p>
          </motion.div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-brand-purple/10 to-white/5 border border-brand-purple/20 rounded-2xl p-8 mb-12"
          >
            <div className="flex items-start gap-6 mb-8">
              <div className="w-16 h-16 rounded-full bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                <Mail className="text-brand-purple" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Email</h2>
                <p className="text-[#94a3b8] mb-4">Send us an email at:</p>
                <a
                  href="mailto:vjramx@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg transition"
                >
                  vjramx@gmail.com
                  <ArrowRight size={18} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h3>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">What should I email you about?</h4>
              <p className="text-[#94a3b8]">
                Feel free to reach out with any feedback, feature requests, bug reports, or general inquiries about SureCv. We appreciate all kinds of communication!
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">How quickly will you respond?</h4>
              <p className="text-[#94a3b8]">
                We typically respond to emails within 24-48 hours. For urgent matters, please mark your subject line as [URGENT].
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">Can I get support for account issues?</h4>
              <p className="text-[#94a3b8]">
                Absolutely! If you're experiencing any issues with your account or the platform, please email us with a detailed description of the problem.
              </p>
            </div>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 pt-8 border-t border-white/10 text-center"
          >
            <p className="text-[#94a3b8] mb-4">Other pages:</p>
            <div className="flex items-center justify-center gap-6">
              <Link to="/" className="text-brand-purple hover:text-brand-purple/80 transition font-semibold">
                Home
              </Link>
              <Link to="/privacy" className="text-brand-purple hover:text-brand-purple/80 transition font-semibold">
                Privacy Policy
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
