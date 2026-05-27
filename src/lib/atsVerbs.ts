/**
 * Power verb library for ATS optimization
 * Organized by impact level
 */

export interface VerbLibrary {
  leadership: string[];
  building: string[];
  improving: string[];
  achieving: string[];
  analyzing: string[];
  managing: string[];
}

export const POWER_VERBS: VerbLibrary = {
  leadership: [
    'Led',
    'Directed',
    'Spearheaded',
    'Championed',
    'Orchestrated',
    'Pioneered',
    'Steered',
  ],
  building: [
    'Architected',
    'Engineered',
    'Developed',
    'Built',
    'Launched',
    'Constructed',
    'Established',
    'Created',
  ],
  improving: [
    'Optimized',
    'Streamlined',
    'Accelerated',
    'Enhanced',
    'Transformed',
    'Refined',
    'Elevated',
    'Improved',
  ],
  achieving: [
    'Delivered',
    'Exceeded',
    'Surpassed',
    'Generated',
    'Secured',
    'Captured',
    'Achieved',
    'Completed',
  ],
  analyzing: [
    'Analyzed',
    'Evaluated',
    'Identified',
    'Synthesized',
    'Forecasted',
    'Assessed',
    'Examined',
    'Interpreted',
  ],
  managing: [
    'Managed',
    'Coordinated',
    'Oversaw',
    'Administered',
    'Supervised',
    'Orchestrated',
    'Controlled',
  ],
};

export const WEAK_VERBS: { [key: string]: string } = {
  worked: 'Engineered/Built/Developed',
  helped: 'Contributed/Supported/Facilitated',
  did: 'Executed/Implemented/Delivered',
  'was responsible for': 'Led/Managed/Directed',
  participated: 'Collaborated/Partnered',
  assisted: 'Supported/Enabled',
  'involved in': 'Drove/Spearheaded',
  'responsible for': 'Owned/Drove',
  handled: 'Managed/Administered',
  performed: 'Executed/Delivered',
  accomplished: 'Achieved/Delivered',
  'taken on': 'Assumed/Assumed',
  made: 'Built/Created/Developed',
  'took part in': 'Participated/Contributed',
  'charged with': 'Tasked/Led',
  ensured: 'Guaranteed/Delivered',
};

export const ALL_POWER_VERBS: Set<string> = new Set([
  ...Object.values(POWER_VERBS).flat(),
  'Built',
  'Created',
  'Established',
  'Pioneered',
  'Steered',
  'Constructed',
  'Refined',
  'Elevated',
  'Captured',
  'Assessed',
  'Examined',
  'Interpreted',
  'Controlled',
  'Drove',
  'Owned',
  'Assumed',
  'Guaranteed',
  'Tasked',
  'Partnered',
  'Facilitated',
]);

/**
 * Check if a word is a weak verb
 */
export function isWeakVerb(word: string): boolean {
  const lowerWord = word.toLowerCase();
  return Object.keys(WEAK_VERBS).includes(lowerWord);
}

/**
 * Get replacement for weak verb
 */
export function getReplacement(weakVerb: string): string {
  return WEAK_VERBS[weakVerb.toLowerCase()] || weakVerb;
}

/**
 * Check if a word is a power verb
 */
export function isPowerVerb(word: string): boolean {
  return ALL_POWER_VERBS.has(word);
}

/**
 * Extract first word from a bullet point
 */
export function extractFirstWord(bullet: string): string {
  const trimmed = bullet.trim().replace(/^[-•*]\s*/, '');
  const firstWord = trimmed.split(/\s+/)[0];
  return firstWord;
}

/**
 * Find all weak verbs in text
 */
export function findWeakVerbs(text: string): string[] {
  const found: string[] = [];
  Object.keys(WEAK_VERBS).forEach((verb) => {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    if (regex.test(text)) {
      found.push(verb);
    }
  });
  return found;
}
