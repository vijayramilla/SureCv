// Razorpay Payment Integration
import { doc, updateDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import { getFirstDayNextMonth } from './userUtils'
import { PLAN_OPTIMIZATION_LIMITS } from '../constants/plans'

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Live Razorpay Keys - from environment variables only
// Frontend: Only the public key (VITE_) is used for client-side payments
const RAZORPAY_KEY = (import.meta.env.VITE_RAZORPAY_KEY_ID as string);

// Validate Razorpay configuration - only check public key on frontend
if (!RAZORPAY_KEY) {
  console.warn('Razorpay public key not configured. Payments will not work.');
}

// Load Razorpay SDK
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface PaymentOptions {
  planId: string;
  planName: string;
  amount: number; // in paise (₹1 = 100 paise)
  description: string;
  isSubscription: boolean;
  userEmail: string;
  userId: string;
  userName: string;
}

export async function initiatePayment(options: PaymentOptions): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Failed to load Razorpay');
  }

  const {
    planId,
    planName,
    amount,
    description,
    isSubscription,
    userEmail,
    userId,
    userName,
  } = options;

  console.log('🚀 Initiating Razorpay payment:', { planId, amount, userName, userEmail });

  const paymentData = {
    key: RAZORPAY_KEY,
    amount: amount,
    currency: 'INR',
    name: 'SureCv',
    description: description,
    image: '/logo.svg',
    prefill: {
      name: userName,
      email: userEmail,
    },
    notes: {
      planId,
      planName,
      userId,
      isSubscription: String(isSubscription),
    },
    handler: (response: any) => {
      // CRITICAL: Don't make this async - Razorpay expects synchronous handler
      // Instead, queue the async operations
      handlePaymentSuccess(response, planId, amount)
    },
    onerror: (error: any) => {
      console.error('Razorpay payment error:', error)
      window.location.href = '/billing?status=error&reason=razorpay'
    },
    modal: {
      ondismiss: () => {
        console.log('Payment cancelled')
      },
    },
    retry: {
      enabled: true,
      max_count: 3,
    },
    timeout: 600,
    theme: {
      color: '#7c3aed',
    },
  };

  const razorpay = new window.Razorpay(paymentData);
  razorpay.open();
}

// Handle payment success asynchronously
async function handlePaymentSuccess(response: any, planId: string, amount: number): Promise<void> {
  try {
    console.log('💳 Payment success handler triggered');
    console.log('📦 Full Response Object:', response);
    console.log('📦 Response Keys:', Object.keys(response));
    console.log('📦 Response Values:', { 
      paymentId: response.razorpay_payment_id,
      orderId: response.razorpay_order_id,
      signature: response.razorpay_signature,
      planId,
      amount
    });

    const user = auth.currentUser;
    if (!user) {
      console.error('❌ User not authenticated');
      window.location.href = '/billing?status=error&reason=no_user';
      return;
    }

    console.log('👤 User authenticated:', user.uid);
    console.log('⚙️ Processing payment success for plan:', planId);

    // Validate response has payment ID
    if (!response.razorpay_payment_id) {
      console.error('❌ Missing razorpay_payment_id in response');
      window.location.href = '/billing?status=error&reason=missing_payment_id';
      return;
    }

    console.log('✅ Payment ID validated:', response.razorpay_payment_id);

    // Plan configuration for Firestore update
    const planConfig: Record<string, any> = {
      starter: {
        plan: 'starter',
        optimizationsLeft: PLAN_OPTIMIZATION_LIMITS.starter,
        optimizationsUsed: 0,
        planExpiresAt: null, // one-time, never expires
        nextResetDate: Timestamp.fromDate(getFirstDayNextMonth()),
      },
      power: {
        plan: 'power',
        optimizationsLeft: 999,
        optimizationsUsed: 0,
        planExpiresAt: Timestamp.fromDate(
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 365 days from now (1 year)
        ),
        nextResetDate: Timestamp.fromDate(getFirstDayNextMonth()),
      },
    };

    if (!planConfig[planId]) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    console.log('📋 Plan config:', planConfig[planId]);

    // Build update object - only include fields that are defined
    const updateData: any = {
      ...planConfig[planId],
      planActivatedAt: serverTimestamp(),
    };

    // Only add payment IDs if they exist
    if (response.razorpay_payment_id) {
      updateData.lastPaymentId = response.razorpay_payment_id;
    }
    if (response.razorpay_order_id) {
      updateData.lastOrderId = response.razorpay_order_id;
    }
    if (response.razorpay_signature) {
      updateData.lastPaymentSignature = response.razorpay_signature;
    }

    console.log('📝 Update data:', updateData);

    // Update Firestore with new plan
    const userRef = doc(db, 'users', user.uid);
    console.log('🔄 Updating Firestore user doc:', user.uid);
    
    try {
      await updateDoc(userRef, updateData);
      console.log('✅ Firestore user doc updated successfully');
    } catch (firestoreError) {
      console.error('❌ Firestore update error:', firestoreError);
      throw firestoreError;
    }

    // Save payment record to Firestore - only include defined fields
    const paymentsRef = collection(db, 'users', user.uid, 'payments');
    console.log('💾 Saving payment record...');
    
    const paymentRecord: any = {
      planId,
      amount: amount / 100, // Convert paise to rupees
      status: 'success',
      createdAt: serverTimestamp(),
    };

    // Add optional fields if they exist
    if (response.razorpay_payment_id) {
      paymentRecord.paymentId = response.razorpay_payment_id;
    }
    if (response.razorpay_order_id) {
      paymentRecord.orderId = response.razorpay_order_id;
    }
    if (response.razorpay_signature) {
      paymentRecord.signature = response.razorpay_signature;
    }

    console.log('📝 Payment record:', paymentRecord);
    
    try {
      await addDoc(paymentsRef, paymentRecord);
      console.log('✅ Payment record saved successfully');
    } catch (firestoreError) {
      console.error('❌ Payment record save error:', firestoreError);
      throw firestoreError;
    }

    // Success - redirect
    console.log('🎉 Payment successful! Redirecting...');
    window.location.href = `/billing?status=success&plan=${planId}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Payment handling error:', errorMessage);
    console.error('❌ Full error:', error);
    window.location.href = `/billing?status=error&reason=${encodeURIComponent(errorMessage)}`;
  }
}

// Get plan details for payment
export function getPlanPaymentDetails(planId: string): PaymentOptions | null {
  const plans: Record<string, Omit<PaymentOptions, 'userEmail' | 'userId' | 'userName'>> = {
    starter: {
      planId: 'starter',
      planName: 'Starter',
      amount: 9900, // ₹99 in paise
      description: `Starter Plan - ${PLAN_OPTIMIZATION_LIMITS.starter} resume optimizations`,
      isSubscription: false,
    },
    power: {
      planId: 'power',
      planName: 'Power',
      amount: 49900, // ₹499 in paise
      description: 'Power Plan - Unlimited optimizations/month',
      isSubscription: true,
    },
  };

  return plans[planId] as PaymentOptions | null;
}
