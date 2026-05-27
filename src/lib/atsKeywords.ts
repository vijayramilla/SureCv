/**
 * Industry-specific keyword intelligence for ATS optimization
 */

export interface IndustryKeywords {
  languages: string[];
  cloud: string[];
  aiml: string[];
  devops: string[];
  data: string[];
  methods: string[];
}

export interface FinanceKeywords {
  technical: string[];
  tools: string[];
  certs: string[];
  fintech: string[];
}

export interface HealthcareKeywords {
  compliance: string[];
  systems: string[];
  clinical: string[];
  emerging: string[];
}

export interface MarketingKeywords {
  digital: string[];
  analytics: string[];
  tools: string[];
  metrics: string[];
  brand: string[];
}

export const TECH_KEYWORDS: IndustryKeywords = {
  languages: [
    'Python',
    'JavaScript',
    'TypeScript',
    'Go',
    'Java',
    'SQL',
    'Rust',
    'C++',
    'PHP',
    'Ruby',
  ],
  cloud: [
    'AWS',
    'Azure',
    'GCP',
    'AWS Lambda',
    'Kubernetes',
    'Docker',
    'Terraform',
    'CloudFormation',
    'Google Cloud',
  ],
  aiml: [
    'TensorFlow',
    'PyTorch',
    'LLM',
    'RAG',
    'MLOps',
    'Vector databases',
    'Machine Learning',
    'Deep Learning',
    'Neural Networks',
  ],
  devops: [
    'CI/CD',
    'Jenkins',
    'GitHub Actions',
    'Microservices',
    'REST API',
    'GitLab CI',
    'Infrastructure as Code',
    'Containerization',
  ],
  data: [
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'Kafka',
    'Spark',
    'Snowflake',
    'dbt',
    'BigQuery',
    'Elasticsearch',
  ],
  methods: [
    'Agile',
    'Scrum',
    'TDD',
    'System design',
    'Scalability',
    'SOLID principles',
    'Design Patterns',
  ],
};

export const FINANCE_KEYWORDS: FinanceKeywords = {
  technical: [
    'Financial modeling',
    'GAAP',
    'IFRS',
    'SOX compliance',
    'Risk management',
    'Portfolio management',
    'Due diligence',
    'Financial analysis',
    'P&L',
    'Budget forecasting',
  ],
  tools: [
    'Bloomberg Terminal',
    'SAP',
    'Excel (advanced)',
    'Power BI',
    'VBA',
    'Python',
    'SQL',
    'Tableau',
  ],
  certs: ['CPA', 'CFA', 'CFP', 'FRM', 'Series 7', 'Series 63'],
  fintech: [
    'ESG reporting',
    'DeFi',
    'Regulatory compliance',
    'FinTech',
    'Blockchain',
    'APIs',
  ],
};

export const HEALTHCARE_KEYWORDS: HealthcareKeywords = {
  compliance: [
    'HIPAA',
    'HITECH',
    'Joint Commission',
    'CMS regulations',
    'GDPR',
    'FDA compliance',
  ],
  systems: [
    'Electronic Health Record (EHR)',
    'EMR',
    'Epic',
    'Cerner',
    'HL7',
    'FHIR',
    'ICD-10',
    'CPT',
  ],
  clinical: [
    'Patient outcomes',
    'Care coordination',
    'Evidence-based',
    'Patient safety',
    'Quality metrics',
    'Clinical documentation',
  ],
  emerging: [
    'Telemedicine',
    'Remote patient monitoring',
    'Value-based care',
    'Population health',
  ],
};

export const MARKETING_KEYWORDS: MarketingKeywords = {
  digital: [
    'SEO',
    'SEM',
    'PPC',
    'Google Ads',
    'Meta Ads',
    'Content marketing',
    'Email marketing',
    'A/B testing',
    'CRO',
    'Demand generation',
  ],
  analytics: [
    'Google Analytics',
    'Attribution modeling',
    'Customer segmentation',
    'Conversion tracking',
    'Data analysis',
  ],
  tools: [
    'HubSpot',
    'Marketo',
    'Salesforce',
    'Hootsuite',
    'WordPress',
    'Google Tag Manager',
    'Mixpanel',
  ],
  metrics: [
    'MQL',
    'SQL',
    'CAC',
    'LTV',
    'ROAS',
    'CTR',
    'CPL',
    'MRR',
    'NPS',
    'Churn',
  ],
  brand: [
    'Go-to-market strategy',
    'Brand positioning',
    'Campaign management',
    'Market research',
    'Competitive analysis',
  ],
};

/**
 * Detect industry from job description
 */
export function detectIndustry(jobDescription: string): string {
  const lowerJD = jobDescription.toLowerCase();

  // Tech detection
  const techIndicators = [
    'software',
    'engineer',
    'developer',
    'backend',
    'frontend',
    'full stack',
    'devops',
    'cloud',
    'python',
    'javascript',
    'kubernetes',
    'aws',
  ];
  if (techIndicators.some((ind) => lowerJD.includes(ind))) return 'tech';

  // Finance detection
  const financeIndicators = [
    'finance',
    'financial',
    'banking',
    'investment',
    'portfolio',
    'trader',
    'analyst',
    'accounting',
    'cpa',
    'cfa',
    'bloomberg',
  ];
  if (financeIndicators.some((ind) => lowerJD.includes(ind))) return 'finance';

  // Healthcare detection
  const healthcareIndicators = [
    'healthcare',
    'medical',
    'nurse',
    'physician',
    'hospital',
    'clinical',
    'hipaa',
    'ehr',
    'patient care',
    'health',
  ];
  if (healthcareIndicators.some((ind) => lowerJD.includes(ind)))
    return 'healthcare';

  // Marketing detection
  const marketingIndicators = [
    'marketing',
    'seo',
    'sem',
    'ppc',
    'campaign',
    'brand',
    'content',
    'social media',
    'analytics',
  ];
  if (marketingIndicators.some((ind) => lowerJD.includes(ind)))
    return 'marketing';

  return 'general';
}

/**
 * Get relevant keywords for detected industry
 */
export function getIndustryKeywords(industry: string): string[] {
  const keywords: string[] = [];

  if (industry === 'tech') {
    keywords.push(
      ...TECH_KEYWORDS.languages,
      ...TECH_KEYWORDS.cloud,
      ...TECH_KEYWORDS.aiml,
      ...TECH_KEYWORDS.devops,
      ...TECH_KEYWORDS.data,
      ...TECH_KEYWORDS.methods
    );
  } else if (industry === 'finance') {
    keywords.push(
      ...FINANCE_KEYWORDS.technical,
      ...FINANCE_KEYWORDS.tools,
      ...FINANCE_KEYWORDS.certs,
      ...FINANCE_KEYWORDS.fintech
    );
  } else if (industry === 'healthcare') {
    keywords.push(
      ...HEALTHCARE_KEYWORDS.compliance,
      ...HEALTHCARE_KEYWORDS.systems,
      ...HEALTHCARE_KEYWORDS.clinical,
      ...HEALTHCARE_KEYWORDS.emerging
    );
  } else if (industry === 'marketing') {
    keywords.push(
      ...MARKETING_KEYWORDS.digital,
      ...MARKETING_KEYWORDS.analytics,
      ...MARKETING_KEYWORDS.tools,
      ...MARKETING_KEYWORDS.metrics,
      ...MARKETING_KEYWORDS.brand
    );
  }

  return keywords;
}
