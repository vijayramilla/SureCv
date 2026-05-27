import { useAuth } from '../contexts/AuthContext'

export interface PlanFeatures {
  // Navbar visibility
  showResumes: boolean
  showJobTracker: boolean
  showHistory: boolean
  showBilling: boolean

  // Feature access
  canDownloadDOCX: boolean
  canGenerateCoverLetter: boolean
  canUseJobTracker: boolean
  canViewHistory: boolean
  canUseAdvancedATS: boolean
  canUseWeakVerbReplacement: boolean
  canUseRecruiterTips: boolean

  // Limits
  optimizationsLeft: number
  optimizationsUsed: number
  plan: 'free' | 'starter' | 'power'
}

export function usePlanFeatures(): PlanFeatures {
  const { userProfile } = useAuth()
  const plan = userProfile?.plan || 'free'
  const optimizationsLeft = userProfile?.optimizationsLeft || 0
  const optimizationsUsed = userProfile?.optimizationsUsed || 0

  return {
    // Navbar visibility
    showResumes: plan === 'power',
    showJobTracker: plan === 'starter' || plan === 'power',
    showHistory: plan === 'power',
    showBilling: true, // always visible

    // Feature access
    canDownloadDOCX: plan === 'starter' || plan === 'power',
    canGenerateCoverLetter: plan === 'starter' || plan === 'power',
    canUseJobTracker: plan === 'starter' || plan === 'power',
    canViewHistory: plan === 'power',
    canUseAdvancedATS: plan === 'power',
    canUseWeakVerbReplacement: plan === 'power',
    canUseRecruiterTips: plan === 'power',

    // Limits
    optimizationsLeft,
    optimizationsUsed,
    plan,
  }
}
