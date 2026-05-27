import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, TrendingUp, FileText, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_OPTIMIZATION_LIMITS } from '../constants/plans';
import { useToast } from '../contexts/ToastContext';
import { calculateDaysUntilReset, calculateUsagePercentage } from '../lib/userUtils';

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

  const usagePercent = calculateUsagePercentage(
    userProfile.optimizationsUsed,
    userProfile.optimizationsUsed + userProfile.optimizationsLeft
  );

  const daysLeft = calculateDaysUntilReset(userProfile.nextResetDate);
  const totalOptimizations =
    userProfile.plan === 'power'
      ? PLAN_OPTIMIZATION_LIMITS.power
      : userProfile.plan === 'starter'
        ? PLAN_OPTIMIZATION_LIMITS.starter
        : PLAN_OPTIMIZATION_LIMITS.free;

  // Get resume usage for display
  const resumesCreated = userProfile.resumesCreated || 0;
  const resumeLimit = 2;
  const resumeUsagePercent = (resumesCreated / resumeLimit) * 100;

  // Determine what to display based on plan
  const getUsageDisplay = () => {
    if (userProfile.plan === 'free') {
      return {
        label: 'Resumes Created',
        current: resumesCreated,
        total: resumeLimit,
        percent: resumeUsagePercent,
        showDaysLeft: false,
      };
    } else if (userProfile.plan === 'starter') {
      return {
        label: 'Optimizations Used',
        current: userProfile.optimizationsUsed,
        total: PLAN_OPTIMIZATION_LIMITS.starter,
        percent: usagePercent,
        showDaysLeft: false,
      };
    } else {
      return {
        label: 'Optimizations Used',
        current: userProfile.optimizationsUsed,
        total: PLAN_OPTIMIZATION_LIMITS.power,
        percent: usagePercent,
        showDaysLeft: true,
      };
    }
  }

  const usage = getUsageDisplay();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
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
            <span className="text-white text-sm font-medium">
              {usage.current} of {usage.total === 999 ? 'Unlimited' : usage.total}
            </span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${userProfile.plan === 'power' ? Math.min(5, usage.percent) : usage.percent}%`,
              }}
              className="h-full bg-gradient-to-r from-brand-purple to-brand-purple-light rounded-full"
            />
          </div>
          {usage.showDaysLeft && (
            <p className="text-[#475569] text-xs mt-2">
              Resets in {daysLeft} day{daysLeft !== 1 ? 's' : ''} (
              {userProfile.nextResetDate?.toDate?.()?.toLocaleDateString() || 'N/A'})
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        <div className="glass-card p-5">
          <FileText size={18} className="text-[#64748b] mb-2" />
          <p className="text-2xl font-bold text-white">{userProfile.totalOptimizationsAllTime}</p>
          <p className="text-[#64748b] text-xs">Total Optimizations</p>
        </div>
        <div className="glass-card p-5">
          <TrendingUp size={18} className="text-[#64748b] mb-2" />
          <p className="text-2xl font-bold text-white">{userProfile.optimizationsUsed}</p>
          <p className="text-[#64748b] text-xs">Used This Month</p>
        </div>
        <div className="glass-card p-5">
          <Calendar size={18} className="text-[#64748b] mb-2" />
          <p className="text-2xl font-bold text-white">{daysLeft}</p>
          <p className="text-[#64748b] text-xs">Days Until Reset</p>
        </div>
      </div>

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
                    {payment.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
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
