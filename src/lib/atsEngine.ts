/**
 * ATS Resume Optimization Engine - Core Logic
 * Implements 5-dimension scoring system
 */

import {
  detectIndustry,
  getIndustryKeywords,
  TECH_KEYWORDS,
} from './atsKeywords';
import { findWeakVerbs, isPowerVerb, extractFirstWord } from './atsVerbs';

export interface ATSScoreDimensions {
  keywordMatch: number;
  formatScore: number;
  actionVerbScore: number;
  quantifiedBullets: number;
  sectionCompleteness: number;
}

export interface ATSOptimizationResult {
  atsScore: number;
  scoreDimensions: ATSScoreDimensions;
  scoreLabel: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  missingKeywords: string[];
  addedKeywords: string[];
  weakVerbsFound: Array<{ original: string; replacement: string }>;
  bulletsImproved: number;
  metricsAdded: number;
  industryDetected: 'tech' | 'finance' | 'healthcare' | 'marketing' | 'general';
  recruiterTips: string[];
  rewrittenResume: string;
  coverLetterPoints: string[];
}

/**
 * Extract all keywords from job description
 */
export function extractJDKeywords(jobDescription: string): string[] {
  // Remove common words and extract meaningful terms
  const commonWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'is',
    'are',
    'be',
    'as',
    'we',
    'you',
    'your',
    'our',
    'from',
    'about',
    'job',
    'role',
    'position',
    'team',
    'company',
    'work',
    'experience',
    'will',
    'must',
    'should',
    'can',
    'may',
  ]);

  const words = jobDescription
    .toLowerCase()
    .split(/[\s,;.()]+/)
    .filter(
      (word) =>
        word.length > 3 &&
        !commonWords.has(word) &&
        !/^\d+/.test(word) &&
        !/[^a-z+#]/.test(word)
    );

  return [...new Set(words)];
}

/**
 * Count keyword matches between resume and JD
 */
export function countKeywordMatches(
  resume: string,
  jobDescription: string
): { found: number; total: number } {
  const jdKeywords = extractJDKeywords(jobDescription);
  const resumeLower = resume.toLowerCase();

  const found = jdKeywords.filter((keyword) =>
    resumeLower.includes(keyword)
  ).length;

  return { found, total: jdKeywords.length };
}

/**
 * Calculate keyword match score (0-100)
 */
export function calculateKeywordMatch(
  resume: string,
  jobDescription: string
): number {
  const { found, total } = countKeywordMatches(resume, jobDescription);
  if (total === 0) return 0;
  return Math.round((found / total) * 100);
}

/**
 * Calculate format score (0-100)
 */
export function calculateFormatScore(resume: string): number {
  let score = 0;
  const resumeLower = resume.toLowerCase();

  // Single column (no multi-column markers)
  if (!/\|{2,}|┃|┫/g.test(resume)) score += 30;

  // Standard headers
  const standardHeaders = [
    'professional summary',
    'work experience',
    'skills',
    'education',
    'certifications',
  ];
  let headerCount = 0;
  standardHeaders.forEach((header) => {
    if (resumeLower.includes(header)) headerCount++;
  });
  score += Math.round((headerCount / standardHeaders.length) * 30);

  // No tables or graphics
  if (!/\[TABLE\]|\[GRAPHIC\]|\[IMAGE\]|<table>|<img/i.test(resume)) {
    score += 20;
  }

  // Contact info plain text at top (email visible)
  if (
    /^[^@]*@[^\n]*\n/m.test(resume) ||
    resume.substring(0, 500).includes('@')
  ) {
    score += 20;
  }

  return Math.min(score, 100);
}

/**
 * Calculate action verb score (0-100)
 */
export function calculateActionVerbScore(resume: string): number {
  let score = 0;
  const bullets = resume.match(/[-•*]\s+.+/g) || [];

  if (bullets.length === 0) return 0;

  const weakVerbs = findWeakVerbs(resume);
  const penaltyPerWeak = 10;
  let penalty = weakVerbs.length * penaltyPerWeak;

  bullets.forEach((bullet) => {
    const firstWord = extractFirstWord(bullet);
    if (isPowerVerb(firstWord)) {
      score += 5;
    }
  });

  score = Math.max(0, score - penalty);
  return Math.min(Math.round((score / (bullets.length * 5)) * 100), 100);
}

/**
 * Calculate quantified bullets score (0-100)
 */
export function calculateQuantifiedBulletsScore(resume: string): number {
  const bullets = resume.match(/[-•*]\s+.+/g) || [];
  if (bullets.length === 0) return 0;

  let metricsCount = 0;
  bullets.forEach((bullet) => {
    // Check for percentage, currency, numbers, or quantified words
    if (/\d+%|\$\d+|increased|decreased|improved|reduced|\d+[xX]|\d+\.\d+%/gi.test(bullet)) {
      metricsCount++;
    }
  });

  const score = (metricsCount / bullets.length) * 100;
  return Math.round(score);
}

/**
 * Calculate section completeness score (0-100)
 */
export function calculateSectionCompleteness(resume: string): number {
  let score = 0;
  const resumeLower = resume.toLowerCase();

  if (resumeLower.includes('professional summary')) score += 20;
  if (resumeLower.includes('work experience')) score += 25;
  if (resumeLower.includes('skills')) score += 25;
  if (resumeLower.includes('education')) score += 15;
  if (resumeLower.includes('certifications')) score += 15;

  return Math.min(score, 100);
}

/**
 * Calculate overall ATS score using 5-dimension system
 */
export function calculateATSScore(
  resume: string,
  jobDescription: string
): ATSScoreDimensions {
  const keywordMatch = calculateKeywordMatch(resume, jobDescription);
  const formatScore = calculateFormatScore(resume);
  const actionVerbScore = calculateActionVerbScore(resume);
  const quantifiedBullets = calculateQuantifiedBulletsScore(resume);
  const sectionCompleteness = calculateSectionCompleteness(resume);

  return {
    keywordMatch,
    formatScore,
    actionVerbScore,
    quantifiedBullets,
    sectionCompleteness,
  };
}

/**
 * Calculate total ATS score
 */
export function calculateTotalScore(dimensions: ATSScoreDimensions): number {
  return Math.round(
    dimensions.keywordMatch * 0.4 +
      dimensions.formatScore * 0.2 +
      dimensions.actionVerbScore * 0.15 +
      dimensions.quantifiedBullets * 0.15 +
      dimensions.sectionCompleteness * 0.1
  );
}

/**
 * Get score label based on total score
 */
export function getScoreLabel(score: number): 'Poor' | 'Fair' | 'Good' | 'Excellent' {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

/**
 * Extract candidate name from resume
 */
export function extractCandidateName(resume: string): string {
  const lines = resume.split('\n');
  const firstLine = lines[0].trim();
  // Remove common title words
  const cleaned = firstLine
    .replace(/\b(Resume|CV|Curriculum Vitae)\b/gi, '')
    .trim();
  return cleaned || '';
}

/**
 * Find missing keywords
 */
export function findMissingKeywords(
  resume: string,
  jobDescription: string,
  industry: string
): string[] {
  const resumeLower = resume.toLowerCase();
  const jdKeywords = extractJDKeywords(jobDescription);
  const industryKeywords = getIndustryKeywords(industry);

  const missing = [];

  // Check JD keywords
  for (const keyword of jdKeywords.slice(0, 20)) {
    if (!resumeLower.includes(keyword)) {
      missing.push(keyword);
    }
  }

  // Check industry keywords
  for (const keyword of industryKeywords) {
    if (!resumeLower.includes(keyword.toLowerCase()) && missing.length < 10) {
      missing.push(keyword);
    }
  }

  return missing.slice(0, 10);
}
