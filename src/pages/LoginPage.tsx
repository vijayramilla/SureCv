import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const navigate = useNavigate()
  const { signInWithGoogle, user, userProfile } = useAuth()

  // If already logged in, redirect to optimize
  if (user) {
    return <Navigate to="/optimize" replace />
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
      const isNewUser = !userProfile?.createdAt || userProfile?.totalOptimizationsAllTime === 0

      if (isNewUser) {
        toast('Welcome to SureCv! You have 2 free optimizations this month.', 'success')
      } else {
        toast(`Welcome back, ${userProfile?.name}!`, 'success')
      }

      navigate('/optimize')
    } catch (err: any) {
      const errorMessage = err?.message || 'Sign in failed. Please try again.'
      setError(errorMessage)
      toast(errorMessage, 'error')
      console.error('Google sign-in error:', err)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-[#0d0d12] flex">
      {/* Left side - gradient with features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900/40 via-[#0d0d12] to-purple-800/20 p-12 flex-col justify-between">
        <div>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Get past ATS. Land more interviews.
          </h1>
          <p className="text-[#94a3b8] text-lg mb-12">
            Join 10,000+ job seekers beating ATS filters with intelligence-powered resumes.
          </p>

          {/* Feature checklist */}
          <div className="space-y-4 mb-12">
            {[
              'Deep resume intelligence for ATS systems',
              'Instant ATS score feedback',
              'Keyword matching analysis',
              'Free cover letter generation',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
                <span className="text-white font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-white text-sm leading-relaxed mb-4">
              "I got 3 interview calls in the first week after using SureCv. It's a game-changer!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300 font-semibold text-sm">
                PS
              </div>
              <div>
                <div className="text-white text-sm font-medium">Priya S.</div>
                <div className="text-[#64748b] text-xs">Software Engineer, Bengaluru</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Zap size={24} className="text-white" />
            </div>
            <span className="text-white font-extrabold text-2xl">SureCv</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-[#94a3b8]">Sign in with Google to continue</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-3 mb-6 text-red-400 text-sm"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </motion.div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-[#0d0d0d] font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mb-6"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.57-3.57C17.46 2.69 14.97 2 12 2 7.7 2 3.99 4.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Info card */}
          <div className="bg-purple-600/10 border border-purple-500/25 rounded-lg p-4 mb-8">
            <p className="text-sm text-white font-medium mb-2">🎁 Start Free</p>
            <p className="text-xs text-[#94a3b8]">
              2 free resume optimizations every month. No credit card required. Cancel anytime.
            </p>
          </div>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-4 text-xs text-[#64748b]">
            <a href="/terms" className="hover:text-white transition">
              Terms of Service
            </a>
            <span>·</span>
            <a href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
