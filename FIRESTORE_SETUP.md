# Firestore Security Rules & Setup

## Firestore Security Rules

Add these rules to your Firestore database in the Firebase Console:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only accessible by authenticated users who own the document
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      
      // User's resumes subcollection
      match /resumes/{resumeId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      
      // User's payments subcollection
      match /payments/{paymentId} {
        allow read: if request.auth != null && request.auth.uid == uid;
        allow write: if false; // Only backend/server writes payments
      }
    }
  }
}
```

## Firestore Data Structure

### Collection: `users/{uid}`

Stores user profile and account information:

```json
{
  "uid": "string",
  "name": "string",
  "email": "string",
  "photo": "string | null",
  "plan": "free | starter | power",
  
  // Credits - NEVER reset on login/logout, only on monthly cycle
  "optimizationsLeft": "number",
  "optimizationsUsed": "number",
  "totalOptimizationsAllTime": "number",
  
  // Plan dates
  "planActivatedAt": "Timestamp",
  "planExpiresAt": "Timestamp | null",
  "nextResetDate": "Timestamp",
  
  // Referral system
  "referralCode": "string",
  "referredBy": "string | null",
  "referralCount": "number",
  "bonusOptimizations": "number",
  
  // Timestamps
  "createdAt": "Timestamp",
  "lastLoginAt": "Timestamp",
  "lastSeenAt": "Timestamp"
}
```

### Collection: `users/{uid}/resumes/{resumeId}`

Stores all resume optimization history:

```json
{
  "id": "string",
  "jobTitle": "string",
  "companyName": "string",
  "originalResume": "string",
  "rewrittenResume": "string",
  "coverLetter": "string | optional",
  "atsBefore": "number",
  "atsAfter": "number",
  "missingKeywords": "string[]",
  "addedKeywords": "string[]",
  "createdAt": "Timestamp",
  "status": "completed"
}
```

### Collection: `users/{uid}/payments/{paymentId}`

Stores payment transaction history:

```json
{
  "planId": "string",
  "amount": "number",
  "currency": "string",
  "razorpayPaymentId": "string",
  "razorpayOrderId": "string",
  "status": "success",
  "createdAt": "Timestamp"
}
```

## Setup Instructions

### 1. Environment Variables (.env)

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Firebase Console Configuration

1. **Enable Google Sign-In Provider**:
   - Go to Firebase Console → Authentication → Sign-in Method
   - Enable Google provider
   - Add authorized domains (localhost:5173 for dev, production domain for prod)

2. **Configure OAuth Consent Screen**:
   - Go to Google Cloud Console
   - Configure OAuth consent screen as External app
   - Add necessary scopes: profile, email

3. **Add Authorized Domains**:
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add `localhost` and `127.0.0.1` for local development
   - Add your production domain

4. **Enable Firestore**:
   - Go to Cloud Firestore
   - Create database in production mode
   - Add security rules from above

### 3. Monthly Credit Reset

The system automatically resets credits on the first day of each month:

- **Free Plan**: 2 optimizations/month
- **Starter Plan**: 10 optimizations/month
- **Power Plan**: 999 optimizations/month

Credits are checked and reset on user login via `checkAndResetCredits()` utility.

## Key Security Principles

1. **User Isolation**: Each user can only read/write their own documents
2. **No Credit Tampering**: Credits are updated server-side only, never client-side
3. **Payment Immutability**: Only backend can write to payments collection
4. **Persistent State**: User data persists across login/logout cycles
5. **Device-Agnostic**: Same account on mobile, desktop, any device shows identical data

## Important Notes

- **browserLocalPersistence** in Firebase Auth keeps users logged in across browser closes
- **onSnapshot()** in hooks provides real-time updates when data changes
- **Firestore security rules** are enforced at database level, not application level
- **Credit reset** only happens when `nextResetDate` has passed
- **All timestamps** are server-generated using `serverTimestamp()`

## Testing Security Rules

In Firebase Console → Firestore → Rules → Test:

```javascript
// Should pass - user reading own document
match /users/{uid} {
  allow read: if request.auth.uid == uid;
}

// Should fail - user attempting to read another's document
match /users/{uid} {
  allow read: if request.auth.uid == uid; // fails if request.auth.uid != uid
}

// Should pass - credit update by same user
match /users/{uid} {
  allow write: if request.auth.uid == uid;
}

// Should fail - payment write from client
match /users/{uid}/payments/{paymentId} {
  allow write: if false; // Always fails on client
}
```

## Backend Integration (For Payment Processing)

When processing payments on backend:

1. Verify user authentication with Firebase Admin SDK
2. Create payment document in `users/{uid}/payments/{paymentId}`
3. Simultaneously update user credits in `users/{uid}`
4. Use transactions to ensure consistency:

```javascript
// Backend (Node.js with Firebase Admin SDK)
const batch = db.batch();

// Create payment record
batch.set(db.collection('users').doc(uid).collection('payments').doc(), {
  razorpayPaymentId: paymentId,
  amount: amount,
  status: 'success',
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});

// Update user plan and credits
batch.update(db.collection('users').doc(uid), {
  plan: newPlan,
  planActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
  planExpiresAt: admin.firestore.FieldValue.serverTimestamp(), // Add expiry
  optimizationsLeft: creditAmount,
  optimizationsUsed: 0,
  nextResetDate: getFirstDayNextMonth()
});

await batch.commit();
```

## Troubleshooting

### Issue: Credits not persisting after logout/login

**Solution**: Check that `setPersistence(auth, browserLocalPersistence)` is called in firebase.ts and Firestore data is being fetched on auth state change.

### Issue: "Permission denied" errors

**Solution**: Verify security rules are correctly formatted and user is authenticated. Check browser console for specific error messages.

### Issue: Real-time updates not working

**Solution**: Ensure `onSnapshot()` listeners are properly subscribed and unsubscribed. Check that Firestore rules allow read access for authenticated users.

## References

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)
- [Google Identity and Access Management](https://cloud.google.com/iam/docs)
