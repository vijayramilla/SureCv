import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Minus, Plus, Maximize2 } from 'lucide-react'

const ZOOM_STEP = 0.1
const MIN_ZOOM = 0.4
const MAX_ZOOM = 2

export interface ZoomablePreviewPaneProps {
  children: ReactNode
  /** Base content width in px before zoom (A4 = 595). */
  baseWidth?: number
  className?: string
  toolbarClassName?: string
}

export function ZoomablePreviewPane({
  children,
  baseWidth = 595,
  className = '',
  toolbarClassName = '',
}: ZoomablePreviewPaneProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [userAdjusted, setUserAdjusted] = useState(false)
  const [contentHeight, setContentHeight] = useState(842)

  const measureContent = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    setContentHeight(el.offsetHeight)
  }, [])

  const fitToView = useCallback(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const pad = 40
    const maxW = viewport.clientWidth - pad
    const maxH = viewport.clientHeight - pad
    const naturalW = content.offsetWidth || baseWidth
    const naturalH = content.offsetHeight || 842
    if (naturalW <= 0 || naturalH <= 0 || maxW <= 0 || maxH <= 0) return

    const fit = Math.min(maxW / naturalW, maxH / naturalH, 1)
    const next = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, Math.round(fit * 100) / 100)
    )
    setZoom(next)
    setUserAdjusted(false)
  }, [baseWidth])

  useEffect(() => {
    measureContent()
    if (!userAdjusted) {
      requestAnimationFrame(() => fitToView())
    }
  }, [children, measureContent, fitToView, userAdjusted])

  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const ro = new ResizeObserver(() => {
      measureContent()
      if (!userAdjusted) fitToView()
    })
    ro.observe(viewport)
    ro.observe(content)
    return () => ro.disconnect()
  }, [measureContent, fitToView, userAdjusted])

  const zoomIn = () => {
    setUserAdjusted(true)
    setZoom((z) =>
      Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 100) / 100)
    )
  }

  const zoomOut = () => {
    setUserAdjusted(true)
    setZoom((z) =>
      Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 100) / 100)
    )
  }

  const scaledW = baseWidth * zoom
  const scaledH = contentHeight * zoom

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      <div
        className={`flex items-center justify-center gap-2 py-2 px-3 shrink-0 border-b border-neutral-300 bg-neutral-100 ${toolbarClassName}`}
      >
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Minus size={16} />
        </button>
        <span className="text-xs font-semibold text-neutral-700 min-w-[3rem] text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={fitToView}
          aria-label="Fit to screen"
          title="Fit to screen"
          className="ml-1 flex items-center gap-1 px-2.5 h-8 rounded-lg bg-white border border-neutral-300 text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition-colors"
        >
          <Maximize2 size={14} />
          Fit
        </button>
      </div>

      <div
        ref={viewportRef}
        className="flex-1 min-h-0 overflow-auto bg-neutral-200"
      >
        <div className="p-4 flex justify-center">
          <div
            style={{
              width: scaledW,
              height: scaledH,
              position: 'relative',
            }}
          >
            <div
              ref={contentRef}
              style={{
                width: baseWidth,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
