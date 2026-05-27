import { useEffect, useRef, useState } from 'react'
import { usePDF } from '@react-pdf/renderer'
import { Loader2 } from 'lucide-react'
import { BuilderResumePDF, type ResumeFormData } from './BuilderResumePDF'

const A4_WIDTH = 595
const A4_HEIGHT = 842

export function StablePdfPreview({ data }: { data: ResumeFormData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [debounced, setDebounced] = useState(data)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(data), 350)
    return () => clearTimeout(timer)
  }, [data])

  const [instance, updatePdf] = usePDF({
    document: <BuilderResumePDF data={debounced} />,
  })

  useEffect(() => {
    updatePdf(<BuilderResumePDF data={debounced} />)
  }, [debounced, updatePdf])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateScale = () => {
      const pad = 16
      const w = el.clientWidth - pad
      const h = el.clientHeight - pad
      if (w <= 0 || h <= 0) return
      setScale(Math.min(w / A4_WIDTH, h / A4_HEIGHT, 1))
    }

    updateScale()
    const ro = new ResizeObserver(updateScale)
    ro.observe(el)
    return () => ro.disconnect()
  }, [instance.url])

  const showLoading = instance.loading || !instance.url

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[320px] flex items-center justify-center overflow-hidden bg-[#12121a] rounded-lg"
    >
      {showLoading ? (
        <div className="flex flex-col items-center gap-2 text-[#94a3b8]">
          <Loader2 size={28} className="animate-spin text-purple-400" />
          <span className="text-xs">Updating preview…</span>
        </div>
      ) : (
        <div
          className="bg-white shadow-2xl"
          style={{
            width: A4_WIDTH * scale,
            height: A4_HEIGHT * scale,
            overflow: 'hidden',
          }}
        >
          <iframe
            key={instance.url}
            title="Resume preview"
            src={`${instance.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="border-0 pointer-events-none"
            style={{
              width: A4_WIDTH,
              height: A4_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      )}
    </div>
  )
}
