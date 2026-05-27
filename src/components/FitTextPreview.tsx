import { ZoomablePreviewPane } from './ZoomablePreviewPane'

interface FitTextPreviewProps {
  text: string
  className?: string
}

/** Text resume preview with +/- zoom and scroll (optimize results). */
export default function FitTextPreview({ text, className = '' }: FitTextPreviewProps) {
  return (
    <ZoomablePreviewPane baseWidth={520} className={`h-full min-h-[300px] ${className}`}>
      <div
        className="bg-white rounded-lg shadow-xl p-6 text-[#111111]"
        style={{ width: 520, minHeight: 400 }}
      >
        <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans m-0">
          {text || 'No resume content yet.'}
        </pre>
      </div>
    </ZoomablePreviewPane>
  )
}
