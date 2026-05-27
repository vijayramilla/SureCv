import { PLAN_OPTIMIZATION_LIMITS } from '../constants/plans';

export interface ResumeRecord {
  id: string;
  userId: string;
  candidateName: string;
  targetRole: string;
  targetCompany: string;
  originalScore: number;
  optimizedScore: number;
  scoreLift: number;
  originalResume: string;
  optimizedResume: string;
  atsCompatibility?: {
    taleo: number;
    workday: number;
    greenhouse: number;
    lever: number;
  };
  scoreBreakdown?: {
    keyword_density: { before: number; after: number };
    bullet_impact: { before: number; after: number };
    format_score: { before: number; after: number };
    skills_alignment: { before: number; after: number };
    semantic_density: { before: number; after: number };
  };
  keywordsAdded: string[];
  keywordsMissing: string[];
  skillsAdded?: string[];
  weakVerbsReplaced?: string[];
  improvementsSummary?: string[];
  recruiterTips?: string[];
  jobDescription: string;
  createdAt: string;
  bulletsRewritten?: number;
  keywordsInjected?: number;
}

export interface JobRecord {
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  notes: string;
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
  createdAt: string;
}

export interface UsageData {
  used: number;
  limit: number;
  resetDate: string;
  plan: 'free' | 'starter' | 'power';
}

const getStorageKey = (userId: string, key: string) => `surecv_${userId}_${key}`;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFirstDayOfNextMonth(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

function isPastResetDate(resetDate: string): boolean {
  return new Date(resetDate) <= new Date();
}

// === USER CREDITS ===
export function initializeUserCredits(userId: string): UsageData {
  const key = getStorageKey(userId, 'usage');
  const existing = localStorage.getItem(key);

  if (existing) {
    const usage = JSON.parse(existing) as UsageData;
    if (isPastResetDate(usage.resetDate)) {
      const newUsage: UsageData = { ...usage, used: 0, resetDate: getFirstDayOfNextMonth() };
      localStorage.setItem(key, JSON.stringify(newUsage));
      return newUsage;
    }
    return usage;
  }

  const initial: UsageData = { used: 0, limit: 2, resetDate: getFirstDayOfNextMonth(), plan: 'free' };
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

export function getUsage(userId: string): UsageData {
  const key = getStorageKey(userId, 'usage');
  const data = localStorage.getItem(key);
  if (!data) {
    return initializeUserCredits(userId);
  }
  const usage = JSON.parse(data) as UsageData;

  if (isPastResetDate(usage.resetDate)) {
    const newUsage: UsageData = { ...usage, used: 0, resetDate: getFirstDayOfNextMonth() };
    localStorage.setItem(key, JSON.stringify(newUsage));
    return newUsage;
  }

  return usage;
}

export function incrementUsage(userId: string): UsageData {
  const usage = getUsage(userId);
  const newUsage = { ...usage, used: usage.used + 1 };
  const key = getStorageKey(userId, 'usage');
  localStorage.setItem(key, JSON.stringify(newUsage));
  return newUsage;
}

export function hasCreditsLeft(userId: string): boolean {
  const usage = getUsage(userId);
  return usage.used < usage.limit;
}

export function setPlan(userId: string, plan: UsageData['plan']): void {
  const usage = getUsage(userId);
  const newLimit =
    plan === 'power'
      ? PLAN_OPTIMIZATION_LIMITS.power
      : plan === 'starter'
        ? PLAN_OPTIMIZATION_LIMITS.starter
        : PLAN_OPTIMIZATION_LIMITS.free;
  const newUsage = { ...usage, plan, limit: newLimit, used: 0 };
  const key = getStorageKey(userId, 'usage');
  localStorage.setItem(key, JSON.stringify(newUsage));
}

export function getDaysUntilReset(userId: string): number {
  const usage = getUsage(userId);
  const reset = new Date(usage.resetDate);
  const now = new Date();
  const diff = reset.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getUsagePercent(userId: string): number {
  const usage = getUsage(userId);
  return Math.round((usage.used / usage.limit) * 100);
}

// === RESUMES ===
export function getResumes(userId: string): ResumeRecord[] {
  const key = getStorageKey(userId, 'resumes');
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function saveResume(userId: string, record: Omit<ResumeRecord, 'id' | 'userId' | 'createdAt'>): ResumeRecord {
  const key = getStorageKey(userId, 'resumes');
  const resumes = getResumes(userId);
  const newRecord: ResumeRecord = {
    ...record,
    id: generateId(),
    userId,
    createdAt: new Date().toISOString(),
  };
  resumes.unshift(newRecord);
  localStorage.setItem(key, JSON.stringify(resumes));
  return newRecord;
}

export function deleteResume(userId: string, id: string): void {
  const key = getStorageKey(userId, 'resumes');
  const resumes = getResumes(userId).filter((r) => r.id !== id);
  localStorage.setItem(key, JSON.stringify(resumes));
}

export function getResumeById(userId: string, id: string): ResumeRecord | null {
  return getResumes(userId).find((r) => r.id === id) || null;
}

// === JOBS ===
export function getJobs(userId: string): JobRecord[] {
  const key = getStorageKey(userId, 'jobs');
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function saveJob(userId: string, job: Omit<JobRecord, 'id' | 'userId' | 'createdAt'>): JobRecord {
  const key = getStorageKey(userId, 'jobs');
  const jobs = getJobs(userId);
  const newJob: JobRecord = {
    ...job,
    id: generateId(),
    userId,
    createdAt: new Date().toISOString(),
  };
  jobs.unshift(newJob);
  localStorage.setItem(key, JSON.stringify(jobs));
  return newJob;
}

export function updateJobStatus(userId: string, id: string, status: JobRecord['status']): void {
  const key = getStorageKey(userId, 'jobs');
  const jobs = getJobs(userId).map((j) => (j.id === id ? { ...j, status } : j));
  localStorage.setItem(key, JSON.stringify(jobs));
}

export function deleteJob(userId: string, id: string): void {
  const key = getStorageKey(userId, 'jobs');
  const jobs = getJobs(userId).filter((j) => j.id !== id);
  localStorage.setItem(key, JSON.stringify(jobs));
}

export function getJobById(userId: string, id: string): JobRecord | null {
  return getJobs(userId).find((j) => j.id === id) || null;
}
