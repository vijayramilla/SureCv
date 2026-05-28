import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { calculateDaysUntilReset, calculateDaysUntilExpiry, calculateUsagePercentage } from '../lib/userUtils'

export default function SettingsPage() {
  const { user, userProfile } = useAuth()
  const toast = useToast()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-purple-400" size={24} />
          </div>
          <p className="text-[#94a3b8]">Loading profile...</p>
        </div>
      </div>
    )
  }

  const daysUntilReset = userProfile.plan === 'power' 
    ? calculateDaysUntilExpiry(userProfile.planExpiresAt)
    : calculateDaysUntilReset(userProfile.nextResetDate)
  const usagePercentage = calculateUsagePercentage(
    userProfile.optimizationsUsed,
    userProfile.optimizationsUsed + userProfile.optimizationsLeft
  )
  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'power':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/25'
      case 'starter':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/25'
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/25'
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-[#94a3b8]">Manage your account and preferences</p>
      </motion.div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#12121a]/50 border border-white/5 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          👤 Profile
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-600"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-semibold text-xl">
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-white font-semibold">{user.displayName || 'User'}</p>
              <p className="text-[#64748b] text-sm">{user.email}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plan Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#12121a]/50 border border-white/5 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          🎯 Current Plan
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#94a3b8]">Plan Type</span>
            <span className={`px-3 py-1.5 rounded-full border text-sm font-medium capitalize ${getPlanBadgeColor(userProfile.plan)}`}>
              {userProfile.plan} Plan
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#94a3b8]">Credits This Month</span>
            <span className="text-white font-semibold">{userProfile.optimizationsLeft} remaining</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94a3b8] text-sm">Usage</span>
              <span className="text-white text-sm font-medium">{Math.round(usagePercentage)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  usagePercentage < 50
                    ? 'bg-green-500'
                    : usagePercentage < 80
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#94a3b8]">{userProfile.plan === 'power' ? 'Plan Expiry Date' : 'Reset Date'}</span>
            <span className="text-white font-semibold">{daysUntilReset} days</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#94a3b8]">Total Optimizations (All Time)</span>
            <span className="text-white font-semibold">{userProfile.totalOptimizationsAllTime}</span>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
          ⚠️ Danger Zone
        </h2>

        <p className="text-red-300/80 text-sm mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        ) : (
          <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-4">
            <p className="text-red-300 text-sm mb-4">Are you absolutely sure? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast('Account deletion not yet implemented', 'error')
                  setShowDeleteConfirm(false)
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
