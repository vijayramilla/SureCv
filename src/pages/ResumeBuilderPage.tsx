import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ElementType,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pdf } from '@react-pdf/renderer';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import { CreditCard as Edit, Sparkles, ChevronDown, ChevronUp, Plus, Trash2, Download, Loader2, GripVertical, User, Mail, Phone, MapPin, Linkedin, Globe, GraduationCap, Briefcase, Award, FolderKanban, Save, Eye, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePlanFeatures } from '../hooks/usePlanFeatures';
import {
  callGroqWithFallback,
  safeParseJSON,
  improveSummaryText,
  improveBulletText,
} from '../lib/groq';
import { parseApiError } from '../lib/apiErrors';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  BuilderResumePDF,
  type ResumeFormData,
  type BuilderExperience,
  type BuilderEducation,
  type BuilderCertification,
  type BuilderProject,
} from '../components/BuilderResumePDF';
import UpgradeModal from '../components/UpgradeModal';
import { ResumeHtmlPreview } from '../components/ResumeHtmlPreview';
import { AI_ENGINE_NAME } from '../constants/branding.js';
import { formDataToResumeText } from '../lib/resumeLibrary';

function sanitizeForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}


type Experience = BuilderExperience;
type Education = BuilderEducation;
type Certification = BuilderCertification;
type Project = BuilderProject;
type ResumeData = ResumeFormData;

const emptyResumeData: ResumeData = {
  personalInfo: { name: '', email: '', phone: '', location: '', linkedin: '', portfolio: '' },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
};

// Accordion Section Component
function AccordionSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  optional = false,
}: {
  title: string;
  icon: ElementType;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-purple-400" />
          <span className="text-white font-semibold">{title}</span>
          {optional && (
            <span className="text-xs text-[#64748b] bg-white/5 px-2 py-0.5 rounded-full">
              optional
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={18} className="text-[#64748b]" />
        ) : (
          <ChevronDown size={18} className="text-[#64748b]" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Input Field Component
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  icon?: ElementType;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-white/5 border border-white/10 rounded-lg py-2.5 text-sm text-white placeholder-[#475569] focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${Icon ? 'pl-9 pr-3' : 'px-3'}`}
        />
      </div>
    </div>
  );
}

// AI Improve Button Component
function AIImproveButton({
  onClick,
  loading,
  label = 'Improve',
}: {
  onClick: () => void;
  loading: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all disabled:opacity-50"
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Sparkles size={12} />
      )}
      {loading ? 'Improving...' : label}
    </button>
  );
}

function SortableExperienceWrapper({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        type="button"
        className="absolute left-1 top-4 z-10 p-1 text-[#64748b] hover:text-purple-400 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <div className="pl-6">{children}</div>
    </div>
  );
}

// Main Component
export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const planFeatures = usePlanFeatures();

  const [resumeData, setResumeData] = useState<ResumeData>(emptyResumeData);
  const [activeSection, setActiveSection] = useState<string>('personal');
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedFlash, setShowSavedFlash] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    summary: false,
    bullet: {} as Record<string, boolean>,
    skills: false,
  });

  const buildIdRef = useRef<string>(uuidv4());
  const savedFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const generateId = () => uuidv4();

  useEffect(() => {
    const loadResume = async () => {
      if (!user) return;
      const storedId = localStorage.getItem(`surecv_build_${user.uid}`);
      if (storedId) buildIdRef.current = storedId;
      else localStorage.setItem(`surecv_build_${user.uid}`, buildIdRef.current);

      try {
        const docRef = doc(
          db,
          'users',
          user.uid,
          'resumes',
          `builder_${buildIdRef.current}`
        );
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.formData) {
            const loaded = data.formData as ResumeData;
            setResumeData(loaded);
          }
          setLastSaved(data.updatedAt?.toDate?.() || null);
        }
      } catch (error) {
        console.error('Error loading resume build:', error);
        const local = localStorage.getItem(
          `surecv_builder_${user.uid}_${buildIdRef.current}`
        );
        if (local) {
          const loaded = JSON.parse(local) as ResumeData;
          setResumeData(loaded);
        }
      }
    };
    loadResume();
  }, [user]);

  const handleSave = useCallback(
    async (silent = false) => {
      if (!user) return;

      setIsSaving(true);
      try {
        const docRef = doc(
          db,
          'users',
          user.uid,
          'resumes',
          `builder_${buildIdRef.current}`
        );
        const cleanData = sanitizeForFirestore(resumeData);
        const resumeText = formDataToResumeText(cleanData);
        const displayName = cleanData.personalInfo?.name?.trim() || 'Resume Builder';
        const existing = await getDoc(docRef);

        await setDoc(
          docRef,
          {
            formData: cleanData,
            resumeText,
            title: displayName,
            updatedAt: serverTimestamp(),
            ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
            type: 'builder',
            source: 'builder',
          },
          { merge: true }
        );
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setShowSavedFlash(true);
        if (savedFlashTimeoutRef.current) clearTimeout(savedFlashTimeoutRef.current);
        savedFlashTimeoutRef.current = setTimeout(() => setShowSavedFlash(false), 2000);
        if (!silent) showToast('Resume saved successfully!', 'success');
      } catch (error) {
        console.error('Error saving resume:', error);
        try {
          localStorage.setItem(
            `surecv_builder_${user.uid}_${buildIdRef.current}`,
            JSON.stringify(sanitizeForFirestore(resumeData))
          );
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          if (!silent) showToast('Resume saved locally (cloud sync pending).', 'success');
        } catch {
          if (!silent) showToast('Failed to save resume. Please try again.', 'error');
        }
      } finally {
        setIsSaving(false);
      }
    },
    [user, resumeData, showToast]
  );

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (hasUnsavedChanges) handleSave(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [user, hasUnsavedChanges, handleSave]);

  const handleDownloadPdf = async () => {
    if (planFeatures.plan === 'free') {
      setShowUpgradeModal(true);
      return;
    }
    setDownloadingPdf(true);
    try {
      const blob = await pdf(<BuilderResumePDF data={resumeData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resumeData.personalInfo.name || 'Resume'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('PDF downloaded!', 'success');
    } catch {
      showToast('Failed to generate PDF', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExperienceDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setResumeData((prev) => {
      const oldIndex = prev.experience.findIndex((e) => e.id === active.id);
      const newIndex = prev.experience.findIndex((e) => e.id === over.id);
      return { ...prev, experience: arrayMove(prev.experience, oldIndex, newIndex) };
    });
    setHasUnsavedChanges(true);
  };

  // Update resume data helper
  const updateResumeData = useCallback((updates: Partial<ResumeData>) => {
    setResumeData((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // AI Improve: Professional Summary
  const improveSummary = async () => {
    if (!resumeData.summary.trim()) {
      showToast('Please write a summary first', 'error');
      return;
    }

    setLoadingStates((prev) => ({ ...prev, summary: true }));
    try {
      const improved = await improveSummaryText(resumeData.summary);
      updateResumeData({ summary: improved });
      showToast('Summary improved!', 'success');
    } catch (error) {
      showToast(parseApiError(error).userMessage, 'error');
    } finally {
      setLoadingStates((prev) => ({ ...prev, summary: false }));
    }
  };

  // AI Improve: Bullet Point
  const improveBullet = async (expId: string, bulletIndex: number, currentBullet: string) => {
    const key = `${expId}-${bulletIndex}`;
    setLoadingStates((prev) => ({
      ...prev,
      bullet: { ...prev.bullet, [key]: true },
    }));

    try {
      const improved = await improveBulletText(currentBullet);

      setResumeData((prev) => {
        const newExp = prev.experience.map((exp) => {
          if (exp.id === expId) {
            const newBullets = [...exp.bullets];
            newBullets[bulletIndex] = improved;
            return { ...exp, bullets: newBullets };
          }
          return exp;
        });
        return { ...prev, experience: newExp };
      });
      setHasUnsavedChanges(true);
      showToast('Bullet improved!', 'success');
    } catch (error) {
      showToast(parseApiError(error).userMessage, 'error');
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        bullet: { ...prev.bullet, [key]: false },
      }));
    }
  };

  // AI Suggest: Skills
  const suggestSkills = async () => {
    setLoadingStates((prev) => ({ ...prev, skills: true }));
    try {
      const context = [
        resumeData.summary,
        resumeData.experience.map((e) => `${e.title} at ${e.company}: ${e.bullets.join(', ')}`).join('; '),
        resumeData.education.map((e) => e.degree).join(', '),
      ]
        .filter(Boolean)
        .join(' | ');

      const prompt = `Based on this resume context, suggest 10 relevant technical/professional skills that would be valuable to add.
Context: ${context || 'General professional skills'}

Return ONLY a JSON array of skill strings, nothing else. Example: ["JavaScript", "React", "Node.js"]`;

      const result = await callGroqWithFallback(
        'You are a career expert who suggests relevant skills for resumes.',
        prompt,
        { label: 'Skill suggestions' }
      );
      const parsed = safeParseJSON(result) as string[];

      if (Array.isArray(parsed)) {
        const newSkills = [...new Set([...resumeData.skills, ...parsed])];
        updateResumeData({ skills: newSkills });
        showToast(`${parsed.length} skills suggested!`, 'success');
      }
    } catch (error) {
      showToast(parseApiError(error).userMessage, 'error');
    } finally {
      setLoadingStates((prev) => ({ ...prev, skills: false }));
    }
  };

  // Add Experience
  const addExperience = () => {
    const newExp: Experience = {
      id: generateId(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [''],
    };
    updateResumeData({ experience: [...resumeData.experience, newExp] });
  };

  // Remove Experience
  const removeExperience = (id: string) => {
    updateResumeData({
      experience: resumeData.experience.filter((e) => e.id !== id),
    });
  };

  // Update Experience
  const updateExperience = (id: string, updates: Partial<Experience>) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
    setHasUnsavedChanges(true);
  };

  // Add Education
  const addEducation = () => {
    const newEdu: Education = {
      id: generateId(),
      degree: '',
      school: '',
      location: '',
      graduationDate: '',
    };
    updateResumeData({ education: [...resumeData.education, newEdu] });
  };

  // Remove Education
  const removeEducation = (id: string) => {
    updateResumeData({
      education: resumeData.education.filter((e) => e.id !== id),
    });
  };

  // Update Education
  const updateEducation = (id: string, updates: Partial<Education>) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
    setHasUnsavedChanges(true);
  };

  // Add Certification
  const addCertification = () => {
    const newCert: Certification = {
      id: generateId(),
      name: '',
      issuer: '',
      date: '',
    };
    updateResumeData({ certifications: [...resumeData.certifications, newCert] });
  };

  // Remove Certification
  const removeCertification = (id: string) => {
    updateResumeData({
      certifications: resumeData.certifications.filter((c) => c.id !== id),
    });
  };

  // Update Certification
  const updateCertification = (id: string, updates: Partial<Certification>) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
    setHasUnsavedChanges(true);
  };

  // Add Project
  const addProject = () => {
    const newProj: Project = {
      id: generateId(),
      name: '',
      description: '',
      technologies: [],
    };
    updateResumeData({ projects: [...resumeData.projects, newProj] });
  };

  // Remove Project
  const removeProject = (id: string) => {
    updateResumeData({
      projects: resumeData.projects.filter((p) => p.id !== id),
    });
  };

  // Update Project
  const updateProject = (id: string, updates: Partial<Project>) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
    setHasUnsavedChanges(true);
  };

  // Add/Remove Skill
  const addSkill = (skill: string) => {
    if (skill.trim() && !resumeData.skills.includes(skill.trim())) {
      updateResumeData({ skills: [...resumeData.skills, skill.trim()] });
    }
  };

  const removeSkill = (skill: string) => {
    updateResumeData({ skills: resumeData.skills.filter((s) => s !== skill) });
  };

  // Experience block component
  const ExperienceBlock = ({ exp }: { exp: Experience }) => (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField
            label="Job Title"
            value={exp.title}
            onChange={(v) => updateExperience(exp.id, { title: v })}
            placeholder="e.g. Senior Software Engineer"
          />
          <InputField
            label="Company"
            value={exp.company}
            onChange={(v) => updateExperience(exp.id, { company: v })}
            placeholder="e.g. Google"
          />
          <InputField
            label="Location"
            value={exp.location}
            onChange={(v) => updateExperience(exp.id, { location: v })}
            placeholder="e.g. San Francisco, CA"
            icon={MapPin}
          />
          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Start Date"
              value={exp.startDate}
              onChange={(v) => updateExperience(exp.id, { startDate: v })}
              placeholder="e.g. Jan 2020"
            />
            <div>
              <InputField
                label="End Date"
                value={exp.current ? 'Present' : exp.endDate}
                onChange={(v) => updateExperience(exp.id, { endDate: v })}
                placeholder="e.g. Dec 2023"
              />
              <label className="flex items-center gap-2 mt-1 text-xs text-[#64748b] cursor-pointer">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) =>
                    updateExperience(exp.id, { current: e.target.checked })
                  }
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/50"
                />
                Currently work here
              </label>
            </div>
          </div>
        </div>
        <button
          onClick={() => removeExperience(exp.id)}
          className="ml-2 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-[#94a3b8] font-medium">Bullet Points</label>
        </div>
        {exp.bullets.map((bullet, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <textarea
              value={bullet}
              onChange={(e) => {
                const newBullets = [...exp.bullets];
                newBullets[idx] = e.target.value;
                updateExperience(exp.id, { bullets: newBullets });
              }}
              placeholder="e.g. Led a team of 5 engineers to deliver a new feature that increased user engagement by 25%"
              className="flex-1 textarea-dark min-h-[60px] text-sm py-2"
            />
            <div className="flex flex-col gap-1">
              <AIImproveButton
                onClick={() => improveBullet(exp.id, idx, bullet)}
                loading={loadingStates.bullet[`${exp.id}-${idx}`] || false}
              />
              {exp.bullets.length > 1 && (
                <button
                  onClick={() => {
                    const newBullets = exp.bullets.filter((_, i) => i !== idx);
                    updateExperience(exp.id, { bullets: newBullets });
                  }}
                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            updateExperience(exp.id, { bullets: [...exp.bullets, ''] })
          }
          className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors mt-1"
        >
          <Plus size={14} />
          Add bullet point
        </button>
      </div>
    </div>
  );

  // Education block component
  const EducationBlock = ({ edu }: { edu: Education }) => (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 mb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField
            label="Degree"
            value={edu.degree}
            onChange={(v) => updateEducation(edu.id, { degree: v })}
            placeholder="e.g. B.S. Computer Science"
          />
          <InputField
            label="School"
            value={edu.school}
            onChange={(v) => updateEducation(edu.id, { school: v })}
            placeholder="e.g. Stanford University"
          />
          <InputField
            label="Location"
            value={edu.location}
            onChange={(v) => updateEducation(edu.id, { location: v })}
            placeholder="e.g. Stanford, CA"
            icon={MapPin}
          />
          <InputField
            label="Graduation Date"
            value={edu.graduationDate}
            onChange={(v) => updateEducation(edu.id, { graduationDate: v })}
            placeholder="e.g. May 2020"
          />
          <InputField
            label="GPA (optional)"
            value={edu.gpa || ''}
            onChange={(v) => updateEducation(edu.id, { gpa: v })}
            placeholder="e.g. 3.8/4.0"
          />
        </div>
        <button
          onClick={() => removeEducation(edu.id)}
          className="ml-2 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  // Certification block component
  const CertificationBlock = ({ cert }: { cert: Certification }) => (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 mb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField
            label="Certification Name"
            value={cert.name}
            onChange={(v) => updateCertification(cert.id, { name: v })}
            placeholder="e.g. AWS Solutions Architect"
          />
          <InputField
            label="Issuing Organization"
            value={cert.issuer}
            onChange={(v) => updateCertification(cert.id, { issuer: v })}
            placeholder="e.g. Amazon Web Services"
          />
          <InputField
            label="Date Obtained"
            value={cert.date}
            onChange={(v) => updateCertification(cert.id, { date: v })}
            placeholder="e.g. March 2023"
          />
          <InputField
            label="Credential ID (optional)"
            value={cert.credentialId || ''}
            onChange={(v) => updateCertification(cert.id, { credentialId: v })}
            placeholder="e.g. ABC123XYZ"
          />
        </div>
        <button
          onClick={() => removeCertification(cert.id)}
          className="ml-2 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  // Project block component
  const ProjectBlock = ({ project }: { project: Project }) => (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField
            label="Project Name"
            value={project.name}
            onChange={(v) => updateProject(project.id, { name: v })}
            placeholder="e.g. E-commerce Platform"
          />
          <InputField
            label="Link (optional)"
            value={project.link || ''}
            onChange={(v) => updateProject(project.id, { link: v })}
            placeholder="e.g. https://github.com/user/project"
            icon={Globe}
          />
        </div>
        <button
          onClick={() => removeProject(project.id)}
          className="ml-2 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="mb-3">
        <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">
          Description
        </label>
        <textarea
          value={project.description}
          onChange={(e) => updateProject(project.id, { description: e.target.value })}
          placeholder="Describe what the project does, your role, and impact..."
          className="w-full textarea-dark min-h-[80px] text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">
          Technologies Used
        </label>
        <input
          type="text"
          value={project.technologies.join(', ')}
          onChange={(e) =>
            updateProject(project.id, {
              technologies: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
            })
          }
          placeholder="e.g. React, Node.js, PostgreSQL (comma-separated)"
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder-[#475569] focus:border-purple-500/50 focus:outline-none"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900/30 via-[#0d0d12] to-blue-900/20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                Resume Builder
              </h1>
              <p className="text-[#94a3b8] text-sm">
                Create a professional resume with {AI_ENGINE_NAME}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {showSavedFlash && (
                <span className="text-xs text-green-400 font-medium">Saved ✓</span>
              )}
              {lastSaved && (
                <span className="hidden md:flex items-center gap-1.5 text-xs text-[#64748b]">
                  <Save size={12} />
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="flex items-center gap-1.5 text-xs text-amber-400">
                  <AlertCircle size={12} />
                  Unsaved changes
                </span>
              )}
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="flex md:hidden mt-4 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setMobileTab('edit')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                mobileTab === 'edit'
                  ? 'bg-purple-600 text-white'
                  : 'text-[#94a3b8]'
              }`}
            >
              <Edit size={14} />
              Edit
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                mobileTab === 'preview'
                  ? 'bg-purple-600 text-white'
                  : 'text-[#94a3b8]'
              }`}
            >
              <Eye size={14} />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6">
          {/* Left Panel - Form */}
          <div className={`${mobileTab === 'preview' ? 'hidden lg:block' : ''}`}>
            {/* Personal Info */}
            <AccordionSection
              title="Personal Information"
              icon={User}
              isOpen={activeSection === 'personal'}
              onToggle={() =>
                setActiveSection(activeSection === 'personal' ? '' : 'personal')
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputField
                  label="Full Name"
                  value={resumeData.personalInfo.name}
                  onChange={(v) =>
                    updateResumeData({
                      personalInfo: { ...resumeData.personalInfo, name: v },
                    })
                  }
                  placeholder="e.g. John Doe"
                />
                <InputField
                  label="Email"
                  value={resumeData.personalInfo.email}
                  onChange={(v) =>
                    updateResumeData({
                      personalInfo: { ...resumeData.personalInfo, email: v },
                    })
                  }
                  placeholder="e.g. john@example.com"
                  type="email"
                  icon={Mail}
                />
                <InputField
                  label="Phone"
                  value={resumeData.personalInfo.phone}
                  onChange={(v) =>
                    updateResumeData({
                      personalInfo: { ...resumeData.personalInfo, phone: v },
                    })
                  }
                  placeholder="e.g. +1 (555) 123-4567"
                  type="tel"
                  icon={Phone}
                />
                <InputField
                  label="Location"
                  value={resumeData.personalInfo.location}
                  onChange={(v) =>
                    updateResumeData({
                      personalInfo: { ...resumeData.personalInfo, location: v },
                    })
                  }
                  placeholder="e.g. San Francisco, CA"
                  icon={MapPin}
                />
                <InputField
                  label="LinkedIn"
                  value={resumeData.personalInfo.linkedin}
                  onChange={(v) =>
                    updateResumeData({
                      personalInfo: { ...resumeData.personalInfo, linkedin: v },
                    })
                  }
                  placeholder="e.g. linkedin.com/in/johndoe"
                  icon={Linkedin}
                />
                <InputField
                  label="Portfolio"
                  value={resumeData.personalInfo.portfolio}
                  onChange={(v) =>
                    updateResumeData({
                      personalInfo: { ...resumeData.personalInfo, portfolio: v },
                    })
                  }
                  placeholder="e.g. johndoe.dev"
                  icon={Globe}
                />
              </div>
            </AccordionSection>

            {/* Professional Summary */}
            <AccordionSection
              title="Professional Summary"
              icon={Edit}
              isOpen={activeSection === 'summary'}
              onToggle={() =>
                setActiveSection(activeSection === 'summary' ? '' : 'summary')
              }
            >
              <div>
                <div className="flex items-center justify-end mb-2">
                  <AIImproveButton
                    onClick={improveSummary}
                    loading={loadingStates.summary}
                  />
                </div>
                <textarea
                  value={resumeData.summary}
                  onChange={(e) => updateResumeData({ summary: e.target.value })}
                  placeholder="Write a brief summary of your professional background, key skills, and career goals. Use Improve to enhance it."
                  className="textarea-dark min-h-[120px] text-sm"
                />
                <p className="text-xs text-[#64748b] mt-2">
                  Tip: Keep it concise (2-3 sentences). Highlight your years of experience and key achievements.
                </p>
              </div>
            </AccordionSection>

            {/* Experience */}
            <AccordionSection
              title="Work Experience"
              icon={Briefcase}
              isOpen={activeSection === 'experience'}
              onToggle={() =>
                setActiveSection(activeSection === 'experience' ? '' : 'experience')
              }
            >
              <div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleExperienceDragEnd}
                >
                  <SortableContext
                    items={resumeData.experience.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {resumeData.experience.map((exp) => (
                      <SortableExperienceWrapper key={exp.id} id={exp.id}>
                        <ExperienceBlock exp={exp} />
                      </SortableExperienceWrapper>
                    ))}
                  </SortableContext>
                </DndContext>
                <button
                  onClick={addExperience}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Add Experience
                </button>
              </div>
            </AccordionSection>

            {/* Education */}
            <AccordionSection
              title="Education"
              icon={GraduationCap}
              isOpen={activeSection === 'education'}
              onToggle={() =>
                setActiveSection(activeSection === 'education' ? '' : 'education')
              }
            >
              <div>
                {resumeData.education.map((edu) => (
                  <EducationBlock key={edu.id} edu={edu} />
                ))}
                <button
                  onClick={addEducation}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Add Education
                </button>
              </div>
            </AccordionSection>

            {/* Skills */}
            <AccordionSection
              title="Skills"
              icon={Sparkles}
              isOpen={activeSection === 'skills'}
              onToggle={() =>
                setActiveSection(activeSection === 'skills' ? '' : 'skills')
              }
            >
              <div>
                <div className="flex items-center justify-end mb-3">
                  <AIImproveButton
                    onClick={suggestSkills}
                    loading={loadingStates.skills}
                    label="Suggest skills"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {resumeData.skills.map((skill) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <X size={12} />
                      </button>
                    </motion.span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a skill and press Enter"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder-[#475569] focus:border-purple-500/50 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        addSkill(target.value);
                        target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector(
                        'input[placeholder="Add a skill and press Enter"]'
                      ) as HTMLInputElement;
                      if (input) {
                        addSkill(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-[#64748b] mt-2">
                  Add technical and professional skills relevant to your target roles.
                </p>
              </div>
            </AccordionSection>

            {/* Certifications */}
            <AccordionSection
              title="Certifications"
              icon={Award}
              isOpen={activeSection === 'certifications'}
              onToggle={() =>
                setActiveSection(
                  activeSection === 'certifications' ? '' : 'certifications'
                )
              }
              optional
            >
              <div>
                {resumeData.certifications.map((cert) => (
                  <CertificationBlock key={cert.id} cert={cert} />
                ))}
                <button
                  onClick={addCertification}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Add Certification
                </button>
              </div>
            </AccordionSection>

            {/* Projects */}
            <AccordionSection
              title="Projects"
              icon={FolderKanban}
              isOpen={activeSection === 'projects'}
              onToggle={() =>
                setActiveSection(activeSection === 'projects' ? '' : 'projects')
              }
              optional
            >
              <div>
                {resumeData.projects.map((project) => (
                  <ProjectBlock key={project.id} project={project} />
                ))}
                <button
                  onClick={addProject}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Add Project
                </button>
              </div>
            </AccordionSection>
          </div>

          {/* Right Panel - Preview */}
          <div className={`${mobileTab === 'edit' ? 'hidden lg:block' : ''}`}>
            <div className="glass-card rounded-xl overflow-hidden sticky top-20 flex flex-col h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)]">
              {/* Preview Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-transparent">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-purple-400" />
                  <span className="text-white font-semibold">Live Preview</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {downloadingPdf ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  {downloadingPdf ? 'Generating...' : 'Download PDF'}
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-white/10">
                <ResumeHtmlPreview data={resumeData} />
              </div>

              <div className="px-4 pb-3 text-center text-xs text-[#94a3b8] shrink-0">
                Use + / − to zoom · scroll when zoomed in · PDF uses black theme
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredPlan="starter"
        featureName="PDF Download"
        description="PDF download requires Starter plan."
      />
    </div>
  );
}
