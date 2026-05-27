function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function linkOrText(url, label) {
  if (!url) return ''
  const u = esc(url)
  const href = url.startsWith('http') ? url : `https://${url}`
  return `<a href="${esc(href)}" style="color:var(--accent);text-decoration:none">${u}</a>`
}

/**
 * @param {import('../src/lib/parseResumeText').ParsedResume} data
 * @param {'dark' | 'light'} theme
 */
export function buildResumeHtml(data, theme = 'dark') {
  const dark = theme !== 'light'
  const vars = dark
    ? {
        bg: '#0a0a0f',
        sidebar: '#111118',
        text: '#f0f0f5',
        muted: '#94a3b8',
        accent: '#7f77dd',
        border: '#1e1e2e',
        pillBg: '#1e1e3a',
        pillText: '#afa9ec',
        bullet: '#cbd5e1',
      }
    : {
        bg: '#ffffff',
        sidebar: '#f8f9fc',
        text: '#1a1a2e',
        muted: '#64748b',
        accent: '#534ab7',
        border: '#e2e8f0',
        pillBg: '#ede9fe',
        pillText: '#534ab7',
        bullet: '#334155',
      }

  const contactItems = [
    data.email ? `<div class="contact">✉ ${esc(data.email)}</div>` : '',
    data.phone ? `<div class="contact">☏ ${esc(data.phone)}</div>` : '',
    data.location ? `<div class="contact">📍 ${esc(data.location)}</div>` : '',
    data.linkedin
      ? `<div class="contact">🔗 ${linkOrText(data.linkedin, 'LinkedIn')}</div>`
      : '',
    data.portfolio
      ? `<div class="contact">🔗 ${linkOrText(data.portfolio, 'Portfolio')}</div>`
      : '',
  ]
    .filter(Boolean)
    .join('')

  const skillsHtml = (data.skills || [])
    .map(
      (s) =>
        `<span class="skill-pill">${esc(s)}</span>`
    )
    .join('')

  const educationHtml = (data.education || [])
    .map(
      (e) => `
      <div class="edu-block">
        <div class="edu-degree">${esc(e.degree)}</div>
        <div class="edu-inst">${esc(e.institution)}</div>
        <div class="edu-year">${esc(e.year)}${e.grade ? ` · ${esc(e.grade)}` : ''}</div>
      </div>`
    )
    .join('')

  const certsHtml = (data.certifications || [])
    .map((c) => `<div class="cert-item">${esc(c)}</div>`)
    .join('')

  const experienceHtml = (data.experience || [])
    .map(
      (job) => `
      <div class="job">
        <div class="job-head">
          <div>
            <div class="job-title">${esc(job.title)}</div>
            <div class="job-company">${esc(job.company)}${job.location ? ` · ${esc(job.location)}` : ''}</div>
          </div>
          ${job.duration ? `<div class="job-date">${esc(job.duration)}</div>` : ''}
        </div>
        <ul class="bullets">
          ${(job.bullets || [])
            .map(
              (b) =>
                `<li><span class="dash">—</span>${esc(b)}</li>`
            )
            .join('')}
        </ul>
      </div>`
    )
    .join('')

  const projectsHtml = (data.projects || [])
    .map(
      (p) => `
      <div class="project">
        <div class="project-name">${esc(p.name)}</div>
        ${p.description ? `<div class="project-desc">${esc(p.description)}</div>` : ''}
      </div>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: ${vars.bg};
      --sidebar: ${vars.sidebar};
      --text: ${vars.text};
      --muted: ${vars.muted};
      --accent: ${vars.accent};
      --border: ${vars.border};
      --pill-bg: ${vars.pillBg};
      --pill-text: ${vars.pillText};
      --bullet: ${vars.bullet};
    }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      width: 210mm;
      min-height: 297mm;
    }
    .layout { display: flex; min-height: 297mm; }
    .left {
      width: 35%;
      background: var(--sidebar);
      padding: 28px 22px;
    }
    .right {
      width: 65%;
      background: var(--bg);
      padding: 28px 24px;
    }
    .name {
      font-size: 26px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    .job-title-header {
      font-size: 13px;
      color: var(--accent);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 4px;
    }
    .contact {
      font-size: 11px;
      color: var(--muted);
      margin-top: 8px;
      line-height: 1.5;
      word-break: break-word;
    }
    .section-title {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: var(--accent);
      border-bottom: 1px solid rgba(127, 119, 221, 0.25);
      padding-bottom: 5px;
      margin: 18px 0 10px;
    }
    .skill-pill {
      background: var(--pill-bg);
      color: var(--pill-text);
      border: 1px solid rgba(127, 119, 221, 0.25);
      border-radius: 4px;
      padding: 3px 9px;
      font-size: 9.5px;
      font-weight: 500;
      display: inline-block;
      margin: 3px 2px;
    }
    .edu-block { margin-bottom: 12px; }
    .edu-degree { font-size: 11px; font-weight: 600; color: var(--text); }
    .edu-inst { font-size: 10px; color: var(--muted); }
    .edu-year { font-size: 10px; color: var(--accent); margin-top: 2px; }
    .cert-item { font-size: 10px; color: var(--muted); margin-bottom: 6px; }
    .summary {
      font-size: 10.5px;
      color: var(--bullet);
      line-height: 1.65;
      margin-bottom: 8px;
    }
    .job { margin-bottom: 16px; }
    .job-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 6px;
    }
    .job-title { font-size: 13px; font-weight: 600; color: var(--text); }
    .job-company { font-size: 11px; color: var(--muted); font-weight: 500; }
    .job-date { font-size: 10px; color: var(--accent); white-space: nowrap; }
    .bullets { list-style: none; padding: 0; }
    .bullets li {
      font-size: 10.5px;
      color: var(--bullet);
      line-height: 1.6;
      margin-bottom: 4px;
      padding-left: 0;
    }
    .dash { color: var(--accent); margin-right: 6px; }
    .project { margin-bottom: 12px; }
    .project-name { font-size: 12px; font-weight: 600; color: var(--text); }
    .project-desc { font-size: 10px; color: var(--muted); margin-top: 3px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="left">
      <div class="name">${esc(data.name)}</div>
      ${data.title ? `<div class="job-title-header">${esc(data.title)}</div>` : ''}
      ${contactItems}
      ${skillsHtml ? `<div class="section-title">Skills</div>${skillsHtml}` : ''}
      ${educationHtml ? `<div class="section-title">Education</div>${educationHtml}` : ''}
      ${certsHtml ? `<div class="section-title">Certifications</div>${certsHtml}` : ''}
    </aside>
    <main class="right">
      ${data.summary ? `<div class="section-title">Professional Summary</div><p class="summary">${esc(data.summary)}</p>` : ''}
      ${experienceHtml ? `<div class="section-title">Experience</div>${experienceHtml}` : ''}
      ${projectsHtml ? `<div class="section-title">Projects</div>${projectsHtml}` : ''}
    </main>
  </div>
</body>
</html>`
}
