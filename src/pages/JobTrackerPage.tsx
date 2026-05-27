import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Briefcase, Building2, Calendar, X, Trash2, ChevronDown } from 'lucide-react';
import { getJobs, saveJob, updateJobStatus, deleteJob } from '../lib/storage';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlanFeatures } from '../hooks/usePlanFeatures';
import UpgradeModal from '../components/UpgradeModal';
import type { JobRecord } from '../lib/storage';

type JobStatus = JobRecord['status'];

const columns: { key: JobStatus; label: string; icon: string }[] = [
  { key: 'saved', label: 'Saved', icon: '💾' },
  { key: 'applied', label: 'Applied', icon: '📤' },
  { key: 'interview', label: 'Interview', icon: '🎙' },
  { key: 'offer', label: 'Offer', icon: '🎉' },
  { key: 'rejected', label: 'Rejected', icon: '❌' },
];

export default function JobTrackerPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [form, setForm] = useState({
    jobTitle: '',
    company: '',
    jobUrl: '',
    notes: '',
    status: 'saved' as JobStatus,
  });
  const toast = useToast();
  const { user } = useAuth();
  const planFeatures = usePlanFeatures();

  // Show upgrade modal if user doesn't have access
  useEffect(() => {
    if (!planFeatures.canUseJobTracker) {
      setShowUpgradeModal(true);
    }
  }, [planFeatures.canUseJobTracker]);

  useEffect(() => {
    if (user) {
      setJobs(getJobs(user.uid));
    }
  }, [user]);

  const handleSave = () => {
    if (!form.jobTitle.trim() || !form.company.trim()) {
      toast('Job title and company are required', 'error');
      return;
    }

    if (user) {
      saveJob(user.uid, {
        jobTitle: form.jobTitle,
        company: form.company,
        jobUrl: form.jobUrl,
        notes: form.notes,
        status: form.status,
      });

      setJobs(getJobs(user.uid));
      setShowModal(false);
      setForm({ jobTitle: '', company: '', jobUrl: '', notes: '', status: 'saved' });
      toast('Job added!', 'success');
    }
  };

  const handleStatusChange = (id: string, status: JobStatus) => {
    if (user) {
      updateJobStatus(user.uid, id, status);
      setJobs(getJobs(user.uid));
      toast('Status updated', 'success');
    }
  };

  const handleDelete = (id: string) => {
    if (user) {
      deleteJob(user.uid, id);
      setJobs(getJobs(user.uid));
      toast('Job deleted', 'info');
    }
  };

  const jobsByStatus = (status: JobStatus) => jobs.filter((j) => j.status === status);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Tracker</h1>
          <p className="text-[#64748b] text-sm mt-1">{jobs.length} job{jobs.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm gap-2">
          <Plus size={16} />
          Add Job
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.key} className="min-w-[280px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span>{col.icon}</span>
              <span className="text-white font-semibold text-sm">{col.label}</span>
              <span className="text-[#475569] text-xs">({jobsByStatus(col.key).length})</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {jobsByStatus(col.key).map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-card p-4 cursor-pointer"
                    onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} className="text-brand-purple" />
                          <span className="text-white font-medium text-sm">{job.jobTitle}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[#64748b] text-xs">
                          <Building2 size={12} />
                          {job.company}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(job.id);
                        }}
                        className="text-[#475569] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#475569] text-xs">
                      <Calendar size={12} />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {expandedJob === job.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 border-t border-white/5 overflow-hidden"
                        >
                          {job.jobUrl && (
                            <a
                              href={job.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-brand-purple text-xs hover:underline block mb-2"
                            >
                              View Job Posting →
                            </a>
                          )}
                          {job.notes && <p className="text-[#94a3b8] text-xs mb-3">{job.notes}</p>}

                          {/* Status dropdown */}
                          <div className="relative">
                            <select
                              value={job.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusChange(job.id, e.target.value as JobStatus);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white appearance-none cursor-pointer"
                            >
                              {columns.map((c) => (
                                <option key={c.key} value={c.key}>
                                  {c.icon} {c.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Add job modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#12121a] border border-white/10 rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">Add Job</h2>
                <button onClick={() => setShowModal(false)} className="text-[#64748b] hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[#94a3b8] text-xs font-medium mb-1.5 block">Job Title *</label>
                  <input
                    type="text"
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder-[#475569] focus:border-brand-purple/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#94a3b8] text-xs font-medium mb-1.5 block">Company *</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Google"
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder-[#475569] focus:border-brand-purple/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#94a3b8] text-xs font-medium mb-1.5 block">Job URL</label>
                  <input
                    type="url"
                    value={form.jobUrl}
                    onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder-[#475569] focus:border-brand-purple/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#94a3b8] text-xs font-medium mb-1.5 block">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any notes..."
                    rows={3}
                    className="textarea-dark"
                  />
                </div>

                <div>
                  <label className="text-[#94a3b8] text-xs font-medium mb-1.5 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:border-brand-purple/50 focus:outline-none"
                  >
                    {columns.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 btn-outline">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 btn-primary">
                  Save Job
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade modal for non-Starter/Power users */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredPlan="starter"
        featureName="Job Tracker Locked"
        description="Track your job applications with our Kanban board. Available in Starter plan and above."
      />
    </motion.div>
  );
}
