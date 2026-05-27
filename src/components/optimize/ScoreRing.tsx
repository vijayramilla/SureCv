import { useEffect, useState } from 'react'

const R = 38
const CIRCUMFERENCE = 2 * Math.PI * R

function scoreStroke(score: number): string {
  if (score >= 80) return '#1d9e75'
  if (score >= 60) return '#7f77dd'
  return '#e24b4a'
}

interface ScoreRingProps {
  score: number
  label: string
}

export function ScoreRing({ score, label }: ScoreRingProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [score])

  const offset = CIRCUMFERENCE - ((mounted ? score : 0) / 100) * CIRCUMFERENCE
  const stroke = scoreStroke(score)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" width={100} height={100} className="block">
        <circle
          cx={50}
          cy={50}
          r={R}
          stroke="#ffffff15"
          strokeWidth={7}
          fill="none"
        />
        <circle
          cx={50}
          cy={50}
          r={R}
          stroke={stroke}
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
        <text
          x={50}
          y={50}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={22}
          fontWeight={600}
          fill={stroke}
        >
          {score}
        </text>
        <text x={50} y={65} fontSize={10} fill="#94a3b8" textAnchor="middle">
          /100
        </text>
      </svg>
      <p className="text-xs text-[#94a3b8] text-center mt-2">{label}</p>
    </div>
  )
}
