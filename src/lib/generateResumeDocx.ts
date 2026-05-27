import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType, UnderlineType, HeadingLevel } from 'docx';

// Black-only color palette
const COLORS = {
  black: '111827',
  darkGray: '374151',
  medGray: '6B7280',
  lightGray: 'F3F4F6',
  white: 'FFFFFF',
};

// Helper functions
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' });
const noBorders = () => ({ 
  top: noBorder(), 
  bottom: noBorder(), 
  left: noBorder(), 
  right: noBorder() 
});

const border = (color = 'D1D5DB') => ({ 
  style: BorderStyle.SINGLE, 
  size: 1, 
  color 
});

function para(text: string, opts: any = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { 
      before: opts.before || 0, 
      after: opts.after || 80, 
      line: opts.line || 276 
    },
    border: opts.bottomBorder ? { 
      bottom: { 
        style: BorderStyle.SINGLE, 
        size: 6, 
        color: opts.bottomBorder, 
        space: 1 
      } 
    } : undefined,
    children: [new TextRun({
      text,
      bold: opts.bold,
      italics: opts.italic,
      color: opts.color || COLORS.black,
      size: (opts.size || 10) * 2,
      font: 'Calibri',
      allCaps: opts.allCaps,
      underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
    })],
  });
}

function heading(text: string, level: 1 | 2 | 3 = 1) {
  const sizes = { 1: 20, 2: 14, 3: 12 };
  return new Paragraph({
    spacing: { 
      before: level === 1 ? 200 : 120, 
      after: 100 
    },
    border: level <= 2 ? { 
      bottom: { 
        style: BorderStyle.SINGLE, 
        size: level === 1 ? 8 : 4, 
        color: COLORS.black, 
        space: 1 
      } 
    } : undefined,
    children: [new TextRun({
      text,
      bold: true,
      color: COLORS.black,
      size: sizes[level] * 2,
      font: 'Calibri',
      allCaps: true,
    })],
  });
}

interface ResumeData {
  candidateName: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experience?: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string[];
  }>;
  education?: Array<{
    degree: string;
    school: string;
    year: string;
    details?: string;
  }>;
  skills?: Array<{
    category: string;
    items: string[];
  }>;
  certifications?: string[];
}

export async function generateResumeDocx(
  resumeText: string,
  candidateName: string,
  email?: string,
  phone?: string,
  location?: string
) {
  // Parse resume text or use provided data
  const resumeData: ResumeData = {
    candidateName,
    email,
    phone,
    location,
  };

  const sections: any[] = [];

  // ═════ HEADER ═════
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({
        text: candidateName.toUpperCase(),
        bold: true,
        color: COLORS.black,
        size: 28,
        font: 'Calibri',
      })],
    })
  );

  // Contact info
  if (email || phone || location) {
    const contactInfo = [email, phone, location].filter(Boolean).join(' • ');
    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({
          text: contactInfo,
          color: COLORS.medGray,
          size: 18,
          font: 'Calibri',
        })],
      })
    );
  }

  // ═════ PARSE RESUME TEXT ═════
  const parsedData = parseResumeText(resumeText);

  // Professional Summary
  if (parsedData.summary) {
    sections.push(heading('PROFESSIONAL SUMMARY', 1));
    sections.push(para(parsedData.summary, { size: 10, after: 120 }));
  }

  // Work Experience
  if (parsedData.experience && parsedData.experience.length > 0) {
    sections.push(heading('WORK EXPERIENCE', 1));
    
    parsedData.experience.forEach((job, idx) => {
      sections.push(para(job.title, { bold: true, size: 11, before: 100, after: 40 }));
      sections.push(para(
        `${job.company} • ${job.startDate} - ${job.endDate}`,
        { color: COLORS.medGray, size: 10, after: 80 }
      ));

      job.description.forEach(bullet => {
        sections.push(
          new Paragraph({
            spacing: { after: 60 },
            indent: { left: 560, hanging: 280 },
            children: [
              new TextRun({
                text: '• ' + bullet,
                color: COLORS.black,
                size: 20,
                font: 'Calibri',
              }),
            ],
          })
        );
      });

      if (idx < parsedData.experience!.length - 1) {
        sections.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      }
    });

    sections.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
  }

  // Education
  if (parsedData.education && parsedData.education.length > 0) {
    sections.push(heading('EDUCATION', 1));

    parsedData.education.forEach((edu, idx) => {
      sections.push(para(edu.degree, { bold: true, size: 11, before: 100, after: 40 }));
      sections.push(para(
        `${edu.school} • ${edu.year}`,
        { color: COLORS.medGray, size: 10, after: 100 }
      ));

      if (edu.details) {
        sections.push(para(edu.details, { size: 10, after: 120 }));
      }

      if (idx < parsedData.education!.length - 1) {
        sections.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
      }
    });

    sections.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
  }

  // Skills
  if (parsedData.skills && parsedData.skills.length > 0) {
    sections.push(heading('SKILLS', 1));

    parsedData.skills.forEach(skillGroup => {
      sections.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: skillGroup.category + ': ',
              bold: true,
              color: COLORS.black,
              size: 20,
              font: 'Calibri',
            }),
            new TextRun({
              text: skillGroup.items.join(', '),
              color: COLORS.black,
              size: 20,
              font: 'Calibri',
            }),
          ],
        })
      );
    });

    sections.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
  }

  // Certifications
  if (parsedData.certifications && parsedData.certifications.length > 0) {
    sections.push(heading('CERTIFICATIONS', 1));

    parsedData.certifications.forEach(cert => {
      sections.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 560, hanging: 280 },
          children: [
            new TextRun({
              text: '• ' + cert,
              color: COLORS.black,
              size: 20,
              font: 'Calibri',
            }),
          ],
        })
      );
    });
  }

  // ═════ CREATE DOCUMENT ═════
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: sections,
    }],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${candidateName.replace(/\s+/g, '_')}_Resume.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseResumeText(resumeText: string): ResumeData {
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  
  const result: ResumeData = {
    candidateName: lines[0] || 'Your Name',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
  };

  let currentSection = '';
  let currentJob: any = null;
  let currentEdu: any = null;
  let currentSkillGroup: any = null;

  const sectionHeaders = [
    'EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE',
    'EDUCATION', 'SKILLS', 'CERTIFICATIONS', 'SUMMARY', 'PROFESSIONAL SUMMARY'
  ];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();

    // Check if it's a section header
    if (sectionHeaders.some(h => upperLine.includes(h))) {
      currentSection = upperLine.split(' ')[0];
      currentJob = null;
      currentEdu = null;
      currentSkillGroup = null;
      continue;
    }

    if (!line) continue;

    // Parse based on current section
    if (currentSection.includes('EXPERIENCE')) {
      // Job title and company line (usually has em-dash or dash)
      if (line.includes('—') || (line.includes('-') && !line.startsWith('-'))) {
        if (currentJob && currentJob.title && currentJob.company) {
          result.experience!.push(currentJob);
        }
        const parts = line.split(/—|-/);
        currentJob = {
          title: parts[0]?.trim() || '',
          company: parts[1]?.trim() || '',
          startDate: '',
          endDate: '',
          description: [],
        };
      } else if (currentJob && (line.startsWith('•') || line.startsWith('-'))) {
        currentJob.description!.push(line.replace(/^[-•]\s*/, ''));
      }
    } else if (currentSection.includes('EDUCATION')) {
      if (currentEdu && !line.includes('•') && !line.startsWith('-')) {
        result.education!.push(currentEdu);
        currentEdu = null;
      }
      if (!currentEdu) {
        currentEdu = { degree: line, school: '', year: '', details: '' };
      } else if (!currentEdu.school) {
        currentEdu.school = line;
      } else if (!currentEdu.year) {
        currentEdu.year = line;
      }
    } else if (currentSection.includes('SKILLS')) {
      if (line.includes(':')) {
        if (currentSkillGroup) {
          result.skills!.push(currentSkillGroup);
        }
        const [category, items] = line.split(':');
        currentSkillGroup = {
          category: category.trim(),
          items: items.split(',').map((s: string) => s.trim()),
        };
      }
    } else if (currentSection.includes('CERTIFICATION')) {
      if (line.startsWith('•') || line.startsWith('-')) {
        result.certifications!.push(line.replace(/^[-•]\s*/, ''));
      } else {
        result.certifications!.push(line);
      }
    } else if (currentSection.includes('SUMMARY')) {
      result.summary = (result.summary || '') + ' ' + line;
    }
  }

  // Push last items
  if (currentJob && currentJob.title) {
    result.experience!.push(currentJob);
  }
  if (currentEdu && currentEdu.school) {
    result.education!.push(currentEdu);
  }
  if (currentSkillGroup) {
    result.skills!.push(currentSkillGroup);
  }

  return result;
}
