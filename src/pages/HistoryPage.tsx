import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Eye, RefreshCw, Trash2, Clock } from 'lucide-react';
import { getResumes, deleteResume } from '../lib/storage';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import type { ResumeRecord } from '../lib/storage';

export default function HistoryPage() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [search, setSearch] = useState('');
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setResumes(getResumes(user.uid));
    }
  }, [user]);

  const handleDelete = (id: string) => {
    if (user) {
      deleteResume(user.uid, id);
      setResumes(getResumes(user.uid));
      toast('Resume deleted from history', 'info');
    }
  };

  const filtered = resumes.filter(
    (r) =>
      r.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.company.toLowerCase().includes(search.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400 bg-green-500/15 border-green-500/30';
    if (score >= 45) return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30';
    return 'text-red-400 bg-red-500/15 border-red-500/30';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">History</h1>
          <p className="text-[#64748b] text-sm mt-1">{resumes.length} optimization{resumes.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or company..."
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-[#475569] focus:border-brand-purple/50 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Clock size={48} className="text-[#475569] mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No history yet</h3>
          <p className="text-[#64748b] text-sm mb-6">
            {search ? 'No results match your search.' : 'Your optimization history will appear here.'}
          </p>
          <Link to="/optimize" className="btn-primary">
            Optimize Resume
          </Link>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[#64748b] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Job Title
                </th>
                <th className="text-left text-[#64748b] text-xs font-medium uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Company
                </th>
                <th className="text-center text-[#64748b] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Before
                </th>
                <th className="text-center text-[#64748b] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  After
                </th>
                <th className="text-center text-[#64748b] text-xs font-medium uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Lift
                </th>
                <th className="text-left text-[#64748b] text-xs font-medium uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Date
                </th>
                <th className="text-right text-[#64748b] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-white text-sm font-medium">{record.jobTitle || 'Position'}</span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-[#94a3b8] text-sm">{record.company || 'Company'}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getScoreColor(
                        record.originalScore
                      )}`}
                    >
                      {record.originalScore}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getScoreColor(
                        record.optimizedScore
                      )}`}
                    >
                      {record.optimizedScore}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center hidden sm:table-cell">
                    <span className="text-brand-purple text-xs font-bold">+{record.scoreLift}</span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-[#64748b] text-xs">{new Date(record.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/results/${record.id}`}
                        className="text-[#64748b] hover:text-white transition-colors"
                        title="View Result"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to="/optimize"
                        className="text-[#64748b] hover:text-brand-purple transition-colors"
                        title="Re-optimize"
                      >
                        <RefreshCw size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-[#64748b] hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
