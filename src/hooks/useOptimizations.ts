import { useAuth } from '../contexts/AuthContext'
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface ResumeData {
  jobTitle: string
  companyName: string
  originalResume: string
  rewrittenResume: string
  coverLetter?: string
  atsBefore: number
  atsAfter: number
  missingKeywords: string[]
  addedKeywords: string[]
  status: 'completed'
}

export function useOptimizations() {
  const { user, userProfile, refreshProfile } = useAuth()

  const canOptimize = (userProfile?.optimizationsLeft ?? 0) > 0

  const useOneCredit = async () => {
    if (!user) throw new Error('User not authenticated')
    if (!canOptimize) throw new Error('No credits left')

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        optimizationsLeft: increment(-1),
        optimizationsUsed: increment(1),
        totalOptimizationsAllTime: increment(1),
      })

      // Refresh profile to reflect changes
      await refreshProfile()
    } catch (error) {
      console.error('Error using optimization credit:', error)
      throw error
    }
  }

  const saveResumeToHistory = async (resumeData: ResumeData): Promise<string> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const resumesCollection = collection(db, 'users', user.uid, 'resumes')
      const docRef = await addDoc(resumesCollection, {
        ...resumeData,
        createdAt: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error('Error saving resume to history:', error)
      throw error
    }
  }

  return {
    canOptimize,
    useOneCredit,
    saveResumeToHistory,
    optimizationsLeft: userProfile?.optimizationsLeft ?? 0,
    optimizationsUsed: userProfile?.optimizationsUsed ?? 0,
    totalOptimizationsAllTime: userProfile?.totalOptimizationsAllTime ?? 0,
  }
}
