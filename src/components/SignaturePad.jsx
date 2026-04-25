import { useRef, useState, useEffect } from 'react'
import { Eraser } from 'lucide-react'

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [empty, setEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    const ratio = window.devicePixelRatio || 1
    canvas.width  = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    const ctx = canvas.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineWidth   = 2
    ctx.lineCap     = 'round'
    ctx.strokeStyle = '#0F172A' // steel-900 — public estimate is always light
  }, [])

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const t = e.touches?.[0]
    return { x: (t?.clientX ?? e.clientX) - rect.left, y: (t?.clientY ?? e.clientY) - rect.top }
  }

  const start = (e) => {
    e.preventDefault()
    const { x, y } = pos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
    setDrawing(true)
  }

  const draw = (e) => {
    if (!drawing) return
    e.preventDefault()
    const { x, y } = pos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
    setEmpty(false)
  }

  const end = () => {
    if (!drawing) return
    setDrawing(false)
    onChange?.(canvasRef.current.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setEmpty(true)
    onChange?.('')
  }

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-steel-300 rounded-lg bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={end}
          className="w-full h-40 touch-none cursor-crosshair"
        />
        {empty && (
          <div className="absolute inset-0 flex items-center justify-center text-steel-400 text-sm pointer-events-none stamp-label">
            Sign here
          </div>
        )}
      </div>
      <button
        onClick={clear}
        className="inline-flex items-center gap-1 text-xs font-semibold text-steel-600 hover:text-steel-900 transition-colors cursor-pointer"
      >
        <Eraser size={12} /> Clear
      </button>
    </div>
  )
}
