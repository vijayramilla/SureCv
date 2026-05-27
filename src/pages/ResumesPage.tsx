import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, Eye, Trash2, Inbox, ArrowRight } from 'lucide-react'
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import jsPDF from 'jspdf'
import { db } from '../lib/firebase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import UpgradeModal from '../components/UpgradeModal'

interface Resume {
  id: string
  jobTitle: string
  companyName: string
  originalResume: string
  rewrittenResume: string
  coverLetter?: string
  atsBefore: number
  atsAfter: number
  missingKeywords: string[]
  addedKeywords: string[]
  createdAt: any
  status: 'completed'
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const toast = useToast()
  const { user } = useAuth()
  const planFeatures = usePlanFeatures()

  // Show upgrade modal if user doesn't have access
  useEffect(() => {
    if (!planFeatures.canViewHistory) {
      setShowUpgradeModal(true)
    }
  }, [planFeatures.canViewHistory])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    const q = query(
      collection(db, 'users', user.uid, 'resumes'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
        })) as Resume[]
        setResumes(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching resumes:', error)
        toast('Failed to load resumes', 'error')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, toast])

  const handleDelete = async (id: string) => {
    if (!user) return

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'resumes', id))
      toast('Resume deleted', 'info')
    } catch (error) {
      console.error('Error deleting resume:', error)
      toast('Failed to delete resume', 'error')
    }
  }

  const handleDownload = (resume: Resume) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 20
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2
    const lineHeight = 6
    let y = margin

    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(79, 70, 229)
    doc.text(`${resume.jobTitle} at ${resume.companyName}`, margin, y)
    y += 12

    // Optimized Resume
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(20, 20, 40)
    doc.text('Optimized Resume:', margin, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const resumeLines = resume.rewrittenResume.split('\n')
    for (const line of resumeLines) {
      const trimmed = line.trim()
      if (trimmed === '') {
        y += lineHeight * 0.5
        continue
      }

      const wrapped = doc.splitTextToSize(trimmed, maxWidth)
      if (y + wrapped.length * lineHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage()
        y = margin
      }

      doc.text(wrapped, margin, y)
      y += wrapped.length * lineHeight
    }

    // ATS Score
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.text('ATS Score:', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.text(`Before: ${resume.atsBefore} → After: ${resume.atsAfter}`, margin, y)

    doc.save(`${resume.companyName}-${resume.jobTitle}.pdf`)
    toast('Resume downloaded', 'success')
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400 bg-green-500/15 border-green-500/30'
    if (score >= 45) return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
    return 'text-red-400 bg-red-500/15 border-red-500/30'
  }

  const formatDate = (date: any) => {
    if (!date) return 'Unknown date'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4 animate-spin">
            <FileText className="text-purple-400" size={24} />
          </div>
          <p className="text-[#94a3b8]">Loading resumes...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Resume History</h1>
          <p className="text-[#64748b] text-sm mt-1">
            {resumes.length} optimized resume{resumes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {resumes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#12121a]/50 border border-white/5 rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4">
            <Inbox size={32} className="text-purple-400" />
          </div>
          <h3 className="text-white font-semibold mb-2 text-lg">No resumes optimized yet</h3>
          <p className="text-[#94a3b8] text-sm mb-6">
            Start by uploading your resume to get deep resume intelligence and instant ATS feedback.
          </p>
          <a href="/optimize" className="btn-primary inline-flex items-center gap-2">
            <ArrowRight size={16} />
            Optimize Your First Resume
          </a>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {resumes.map((resume, index) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-[#12121a]/50 border border-white/5 hover:border-purple-500/25 rounded-xl p-5 flex flex-col transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText size={18} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate group-hover:text-purple-300 transition">
                        {resume.jobTitle}
                      </h3>
                      <p className="text-[#64748b] text-xs truncate">{resume.companyName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="text-[#475569] hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* ATS Score */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-white/5 rounded-lg">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getScoreColor(resume.atsBefore)}`}>
                    {resume.atsBefore}
                  </span>
                  <ArrowRight size={14} className="text-[#475569]" />
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getScoreColor(resume.atsAfter)}`}>
                    {resume.atsAfter}
                  </span>
                  <span className="ml-auto text-xs font-bold text-green-400">
                    +{resume.atsAfter - resume.atsBefore}
                  </span>
                </div>

                {/* Keywords added */}
                {resume.addedKeywords && resume.addedKeywords.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[#64748b] text-xs font-medium mb-2">Keywords added:</p>
                    <div className="flex flex-wrap gap-1">
                      {resume.addedKeywords.slice(0, 3).map((keyword) => (
                        <span key={keyword} className="text-xs px-2 py-1 bg-green-500/10 text-green-300 rounded">
                          {keyword}
                        </span>
                      ))}
                      {resume.addedKeywords.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-300 rounded">
                          +{resume.addedKeywords.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Date */}
                <p className="text-[#64748b] text-xs mb-4">{formatDate(resume.createdAt)}</p>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <a
                    href={`/results/${resume.id}`}
                    className="flex-1 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/25 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-medium"
                  >
                    <Eye size={12} />
                    <span className="hidden sm:inline">View</span>
                  </a>
                  <button
                    onClick={() => handleDownload(resume)}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white border border-white/10 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-medium"
                  >
                    <Download size={12} />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upgrade modal for non-Power users */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredPlan="power"
        featureName="Resume History Locked"
        description="View all your past resume optimizations and improvements. Available in Power plan."
      />
    </motion.div>
  )
}
