import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, TrendingUp, FileText, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_OPTIMIZATION_LIMITS } from '../constants/plans';
import { useToast } from '../contexts/ToastContext';
import { calculateDaysUntilReset, calculateDaysUntilExpiry, calculateUsagePercentage, verifyAndCorrectPowerPlanExpiry, formatFirestoreDate } from '../lib/userUtils';

interface PaymentRecord {
  id: string;
  planId: string;
  paymentId: string;
  orderId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  createdAt: any;
}

export default function BillingPage() {
  const { user, userProfile } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const toast = useToast();

  // Real-time listener for payment history from Firestore
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const paymentsRef = collection(db, 'users', user.uid, 'payments');
    const q = query(paymentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PaymentRecord[];
        setPayments(docs);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading payment history:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');
    const reason = searchParams.get('reason');
    
    if (status === 'success') {
      toast(
        `🎉 Welcome to ${plan === 'starter' ? 'Starter' : 'Power'} Plan! Your credits have been added.`,
        'success'
      );
    } else if (status === 'error') {
      const decodedReason = reason ? decodeURIComponent(reason) : null;
      const errorMsg = decodedReason 
        ? `Payment failed: ${decodedReason}. Please try again.`
        : 'Payment failed. Please try again.';
      toast(errorMsg, 'error');
      console.error('Payment error:', decodedReason);
    }
  }, [searchParams, toast]);

  // Verify and correct Power plan expiry if needed
  useEffect(() => {
    if (user && userProfile && userProfile.plan === 'power') {
      const powerDaysLeft = calculateDaysUntilExpiry(userProfile.planExpiresAt);
      console.log('🔍 Power plan user detected. Profile:', {
        planActivatedAt: userProfile.planActivatedAt,
        planExpiresAt: userProfile.planExpiresAt,
        createdAt: userProfile.createdAt,
        daysLeft: powerDaysLeft
      });
      
      verifyAndCorrectPowerPlanExpiry(user.uid, userProfile)
        .then((corrected) => {
          if (corrected) {
            console.log('✅ Power plan expiry was corrected to 365 days');
          }
        })
        .catch((error) => {
          console.error('Error verifying power plan:', error);
        });
    }
  }, [user, userProfile]);

  if (!userProfile) return null;

  const planName = {
    free: 'Free Plan',
    starter: 'Starter Plan',
    power: 'Power Plan',
  }[userProfile.plan];

  const planPrice = {
    free: '₹0/forever',
    starter: '₹99 one-time',
    power: '₹499/year',
  }[userProfile.plan];

  // Calculate remaining resumes and optimizations
  // Get resume usage for display first
  const resumesCreated = userProfile.resumesCreated || 0;
  const resumeLimit = 2;
  const resumeUsagePercent = (resumesCreated / resumeLimit) * 100;

  const planLimits = {
    free: { optimizations: PLAN_OPTIMIZATION_LIMITS.free, resumes: 2 },
    starter: { optimizations: PLAN_OPTIMIZATION_LIMITS.starter, resumes: 999 },
    power: { optimizations: PLAN_OPTIMIZATION_LIMITS.power, resumes: 999 },
  };

  const currentLimits = planLimits[userProfile.plan];
  const optimizationsRemaining = Math.max(0, userProfile.optimizationsLeft);
  const optimizationsUsedCount = userProfile.optimizationsUsed || 0;
  const resumesRemaining = Math.max(0, currentLimits.resumes - resumesCreated);

  const usagePercent = calculateUsagePercentage(
    userProfile.optimizationsUsed,
    userProfile.optimizationsUsed + userProfile.optimizationsLeft
  );

  // Calculate days left based on plan type
  const daysLeft = userProfile.plan === 'power' 
    ? calculateDaysUntilExpiry(userProfile.planExpiresAt)
    : calculateDaysUntilReset(userProfile.nextResetDate);
  const totalOptimizations =
    userProfile.plan === 'power'
      ? PLAN_OPTIMIZATION_LIMITS.power
      : userProfile.plan === 'starter'
        ? PLAN_OPTIMIZATION_LIMITS.starter
        : PLAN_OPTIMIZATION_LIMITS.free;

  // Determine what to display based on plan
  const getUsageDisplay = () => {
    if (userProfile.plan === 'free') {
      return {
        label: 'Optimizations Left',
        current: optimizationsRemaining,
        total: currentLimits.optimizations,
        percent: usagePercent,
        showDaysLeft: false,
        warning: optimizationsRemaining === 0,
      };
    } else if (userProfile.plan === 'starter') {
      return {
        label: 'Optimizations Left',
        current: optimizationsRemaining,
        total: PLAN_OPTIMIZATION_LIMITS.starter,
        percent: usagePercent,
        showDaysLeft: false,
        warning: optimizationsRemaining <= 1,
      };
    } else {
      return {
        label: 'Subscription Status',
        current: 'Active',
        total: 'Unlimited',
        percent: 5,
        showDaysLeft: false,
        warning: false,
      };
    }
  }

  const usage = getUsageDisplay();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Billing & Usage</h1>
        <p className="text-[#64748b] text-sm mt-1">Manage your plan and view usage statistics</p>
      </div>

      {/* Current plan */}
      <div className="glass-card p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple to-brand-purple-dark flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{planName}</h2>
              <p className="text-[#64748b] text-sm">{planPrice}</p>
            </div>
          </div>
          {userProfile.plan === 'free' && (
            <Link to="/pricing" className="btn-primary text-sm">
              Upgrade
            </Link>
          )}
        </div>

        {/* Usage bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#94a3b8] text-sm">{usage.label}</span>
            <span className={`text-sm font-medium ${
              usage.warning ? 'text-red-400' : 'text-white'
            }`}>
              {usage.current} of {typeof usage.total === 'string' ? usage.total : usage.total}
            </span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${typeof usage.total === 'string' ? Math.min(5, usage.percent) : usage.percent}%`,
              }}
              className={`h-full rounded-full ${
                usage.warning
                  ? 'bg-gradient-to-r from-red-600 to-red-500'
                  : 'bg-gradient-to-r from-brand-purple to-brand-purple-light'
              }`}
            />
          </div>
          {usage.warning && userProfile.plan !== 'power' && (
            <p className="text-red-400 text-xs mt-2 font-medium">
              ⚠️ You're running low on {userProfile.plan === 'free' ? 'free' : ''} optimizations. Upgrade to continue.
            </p>
          )}
          {userProfile.plan === 'starter' && (
            <p className="text-[#475569] text-xs mt-2">
              Resets in {daysLeft} day{daysLeft !== 1 ? 's' : ''} (
              {formatFirestoreDate(userProfile.nextResetDate)})
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        <div className="glass-card p-5">
          <FileText size={18} className="mb-2 text-[#64748b]" />
          <p className="text-2xl font-bold text-white">
            {userProfile.plan === 'power' ? '∞' : optimizationsRemaining}
          </p>
          <p className="text-[#64748b] text-xs">
            {userProfile.plan === 'power' ? 'Unlimited Optimizations' : 'Optimizations Left'}
          </p>
        </div>
        <div className="glass-card p-5">
          <TrendingUp size={18} className="text-[#64748b] mb-2" />
          <p className="text-2xl font-bold text-white">{userProfile.totalOptimizationsAllTime}</p>
          <p className="text-[#64748b] text-xs">Total All-Time</p>
        </div>
        {userProfile.plan !== 'power' && (
          <div className="glass-card p-5">
            <Calendar size={18} className="text-[#64748b] mb-2" />
            <p className="text-2xl font-bold text-white">{Math.max(0, currentLimits.optimizations - optimizationsUsedCount)}</p>
            <p className="text-[#64748b] text-xs">Credits Available</p>
          </div>
        )}
        {userProfile.plan === 'power' && (
          <div className="glass-card p-5 border-l-2 border-green-500/50">
            <Calendar size={18} className="text-green-400 mb-2" />
            <p className="text-2xl font-bold text-white">✓</p>
            <p className="text-[#64748b] text-xs">Plan Active</p>
          </div>
        )}
      </div>

      {/* Power Plan Details */}
      {userProfile.plan === 'power' && (
        <>
          {/* Debug info - remove after testing */}
          {daysLeft === 0 && (
            <div className="glass-card p-4 mb-5 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-xs">
                ⚠️ Debug: daysLeft = {daysLeft}, planExpiresAt = {formatFirestoreDate(userProfile.planExpiresAt)}
              </p>
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 mb-5 border-l-4 border-green-500/50 bg-gradient-to-r from-green-500/5 to-transparent"
          >
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="text-xl">✓</span> Power Plan - Unlimited Subscription
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/5 rounded-lg p-4 border border-green-500/20">
              <p className="text-[#64748b] text-sm mb-1">Plan Status</p>
              <p className="text-green-400 font-semibold text-lg">✓ Active</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 border border-green-500/20">
              <p className="text-[#64748b] text-sm mb-1">Optimizations</p>
              <p className="text-white font-semibold text-lg">Unlimited</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-[#64748b] text-sm mb-1">Purchased Date</p>
              <p className="text-white font-semibold text-lg">
                {formatFirestoreDate(userProfile.planActivatedAt) !== 'N/A' 
                  ? formatFirestoreDate(userProfile.planActivatedAt)
                  : formatFirestoreDate(userProfile.createdAt)}
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-[#64748b] text-sm mb-1">Plan Renewal Date</p>
              <p className="text-white font-semibold text-lg">
                {formatFirestoreDate(userProfile.planExpiresAt)}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-[#64748b] text-sm mb-1">Subscription Period</p>
              <p className="text-white font-semibold text-lg">1 Year</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-[#64748b] text-sm mb-1">Days Remaining</p>
              <p className={`font-semibold text-lg ${daysLeft > 180 ? 'text-green-400' : daysLeft > 90 ? 'text-yellow-400' : daysLeft > 30 ? 'text-orange-400' : 'text-red-400'}`}>
                {daysLeft} Days
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 col-span-2 border-t border-white/10 pt-4">
              <p className="text-[#64748b] text-sm mb-1">Annual Price</p>
              <p className="text-white font-semibold text-lg">₹499/year <span className="text-[#64748b] text-sm font-normal">(No refund policy)</span></p>
            </div>
          </div>

          {/* Features included */}
          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-green-500/20">
            <p className="text-white font-semibold text-sm mb-2">✓ Included Features:</p>
            <ul className="text-[#64748b] text-xs space-y-1">
              <li>✓ Unlimited resume optimizations</li>
              <li>✓ Unlimited ATS score improvements</li>
              <li>✓ All AI rewriting capabilities (NVIDIA)</li>
              <li>✓ Full access to all features</li>
            </ul>
          </div>

          {daysLeft <= 30 && daysLeft > 0 && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 text-sm">
                ⚠️ Subscription expiring soon. Renewal on {formatFirestoreDate(userProfile.planExpiresAt)}
              </p>
            </div>
          )}

          {daysLeft === 0 && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">
                ⚠️ Subscription expired. <Link to="/pricing" className="text-red-300 underline font-semibold">Renew now</Link>
              </p>
            </div>
          )}
        </motion.div>
        </>
      )}

      {/* Upgrade Recommendation */}
      {optimizationsRemaining === 0 && userProfile.plan !== 'power' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-5 border-l-4 border-amber-500 bg-gradient-to-r from-amber-500/10 to-transparent"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-white font-semibold mb-2">You've Used All Your Optimizations! 🚀</h3>
              <p className="text-[#64748b] text-sm">
                {userProfile.plan === 'free'
                  ? "Upgrade to Starter or Power plan to unlock more resume optimizations and features."
                  : "Upgrade to Power plan for unlimited optimizations and exclusive features."}
              </p>
            </div>
            <Link
              to="/pricing"
              className="btn-primary whitespace-nowrap"
            >
              Upgrade Now
            </Link>
          </div>
        </motion.div>
      )}

      {/* Payment history from Firestore */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold text-sm mb-4">Payment History</h3>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw size={32} className="text-[#475569] mx-auto mb-3 animate-spin" />
            <p className="text-[#64748b] text-sm">Loading...</p>
          </div>
        ) : userProfile.plan === 'free' && payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard size={32} className="text-[#475569] mx-auto mb-3" />
            <p className="text-[#64748b] text-sm">No payment history yet</p>
            <p className="text-[#475569] text-xs mt-1">Upgrade to see your invoices here</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle size={32} className="text-[#475569] mx-auto mb-3" />
            <p className="text-[#64748b] text-sm">No payments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  {payment.status === 'success' ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : (
                    <AlertCircle size={20} className="text-red-500" />
                  )}
                  <div>
                    <p className="text-white font-medium capitalize">
                      {payment.planId} Plan
                    </p>
                    <p className="text-[#64748b] text-xs">
                      {payment.paymentId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">₹{payment.amount}</p>
                  <p className="text-[#64748b] text-xs">
                    {formatFirestoreDate(payment.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
