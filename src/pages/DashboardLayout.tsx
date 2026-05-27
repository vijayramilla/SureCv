import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PenLine,
  FileUp,
  FileText,
  Briefcase,
  CreditCard,
  HelpCircle,
  MessageSquare,
  Settings,
  LogOut,
  Zap,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import { calculateDaysUntilReset, calculateUsagePercentage } from '../lib/userUtils'

const allNavItems = [
  { path: '/optimize', label: 'Optimize', feature: 'always' },
  { path: '/resume-builder', label: 'Build Resume', feature: 'always' },
  { path: '/resumes', label: 'Resumes', feature: 'showResumes' },
  { path: '/job-tracker', label: 'Job Tracker', feature: 'showJobTracker' },
  { path: '/pricing', label: 'Pricing', feature: 'always' },
  { path: '/billing', label: 'Billing', feature: 'showBilling' },
]

const allDropdownItems = [
  { icon: PenLine, label: 'Optimize Resume', path: '/optimize', feature: 'always' },
  { icon: FileText, label: 'Build Resume', path: '/resume-builder', feature: 'always' },
  { icon: FileUp, label: 'My Resumes', path: '/resumes', feature: 'showResumes' },
  { icon: Briefcase, label: 'Job Tracker', path: '/job-tracker', feature: 'showJobTracker' },
  { icon: CreditCard, label: 'Pricing', path: '/pricing', feature: 'always' },
  { icon: Settings, label: 'Settings', path: '/settings', feature: 'always' },
  { icon: HelpCircle, label: 'Help & Support', path: '#', feature: 'always' },
  { icon: MessageSquare, label: 'Feedback', path: '#', feature: 'always' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, userProfile, logOut } = useAuth()
  const planFeatures = usePlanFeatures()

  // Filter nav items based on plan
  const navItems = allNavItems.filter(item => {
    if (item.feature === 'always') return true
    return planFeatures[item.feature as keyof typeof planFeatures] as boolean
  })

  const dropdownItems = allDropdownItems.filter(item => {
    if (item.feature === 'always') return true
    return planFeatures[item.feature as keyof typeof planFeatures] as boolean
  })

  const usagePercent = userProfile
    ? calculateUsagePercentage(
        userProfile.optimizationsUsed,
        userProfile.optimizationsUsed + userProfile.optimizationsLeft
      )
    : 0

  const daysLeft = userProfile ? calculateDaysUntilReset(userProfile.nextResetDate) : 0

  // Determine display based on plan
  const getUsageDisplay = () => {
    if (!userProfile) return { text: '', type: 'neutral' }
    
    if (userProfile.plan === 'free') {
      // Show resume usage for free plan
      const resumesCreated = userProfile.resumesCreated || 0
      const resumesLeft = 2 - resumesCreated
      return {
        text: `${resumesCreated}/2 resumes`,
        type: resumesLeft <= 0 ? 'red' : resumesLeft === 1 ? 'yellow' : 'green',
      }
    } else if (userProfile.plan === 'starter') {
      // Show resume usage for starter plan
      return {
        text: 'Unlimited resumes',
        type: 'green',
      }
    } else {
      // Power plan
      return {
        text: 'Unlimited resumes',
        type: 'green',
      }
    }
  }

  const usage = getUsageDisplay()
  
  const getUsageColor = () => {
    if (usage.type === 'red') return 'text-red-400'
    if (usage.type === 'yellow') return 'text-yellow-400'
    return 'text-green-400'
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await logOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const displayName = user?.displayName || userProfile?.name || 'User'
  const avatarUrl = user?.photoURL || userProfile?.photo

  return (
    <div className="min-h-screen bg-[#0d0d12]">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-[#0d0d12]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/optimize" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center shadow-purple-glow transition-transform group-hover:scale-110">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">SureCv</span>
          </Link>

          {/* Center tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-[#64748b] hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-purple rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Usage pill */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium ${getUsageColor()}`}>
              <span>{usage.text}</span>
              {userProfile?.plan !== 'free' && userProfile?.plan !== 'starter' && (
                <>
                  <span className="text-[#475569]">·</span>
                  <span>{daysLeft}d left</span>
                </>
              )}
            </div>

            {/* Upgrade button */}
            {userProfile?.plan === 'free' && (
              <Link to="/billing" className="btn-primary text-xs px-3 py-1.5">
                Upgrade
              </Link>
            )}

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-semibold text-sm">
                    {displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <ChevronDown size={14} className={`text-[#64748b] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-[#12121a] border border-white/10 rounded-xl shadow-xl overflow-hidden"
                  >
                    {/* User info */}
                    <div className="px-4 py-4 border-b border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-semibold">
                            {displayName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-white text-sm font-medium">{displayName}</div>
                          <div className="text-[#64748b] text-xs">{user?.email || userProfile?.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="capitalize px-2 py-1 rounded bg-purple-600/20 text-purple-300 font-medium">
                          {userProfile?.plan || 'free'}
                        </span>
                        <span className="text-[#64748b]">·</span>
                        <span className={`font-medium ${getUsageColor()}`}>
                          {userProfile?.optimizationsLeft ?? 0} remaining this month
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      {dropdownItems.map((item) => (
                        <Link
                          key={item.label}
                          to={item.path}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#94a3b8] hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <item.icon size={16} />
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-white/5 py-1.5">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-colors"
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-full transition-colors ${
                  isActive ? 'bg-brand-purple text-white' : 'text-[#64748b] hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
