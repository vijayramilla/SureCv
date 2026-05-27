function isSectionHeader(line: string): boolean {
  const t = line.trim()
  if (!t || t.length > 70) return false
  const known = [
    'EXPERIENCE',
    'WORK EXPERIENCE',
    'EDUCATION',
    'SKILLS',
    'SUMMARY',
    'PROFESSIONAL SUMMARY',
    'PROJECTS',
    'CERTIFICATIONS',
    'CONTACT',
  ]
  const upper = t.toUpperCase()
  if (known.some((h) => upper === h || upper.startsWith(h + ' '))) return true
  return (
    /^[A-Z0-9\s/&\-–—.:]+$/.test(t) &&
    /[A-Z]{2,}/.test(t) &&
    t.length < 45 &&
    !t.includes('@')
  )
}

export function ResumePaperPreview({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="bg-white rounded-xl p-5 text-[#1a1a1a] text-xs leading-relaxed font-mono shadow-none">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} className="h-2" />

        if (isSectionHeader(trimmed)) {
          return (
            <p
              key={i}
              className="font-semibold text-[13px] mt-3 mb-1 border-b border-gray-200 pb-1"
            >
              {trimmed}
            </p>
          )
        }

        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
          return (
            <li key={i} className="ml-3 mb-0.5 list-none">
              {trimmed}
            </li>
          )
        }

        return (
          <p key={i} className="mb-0.5">
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}
