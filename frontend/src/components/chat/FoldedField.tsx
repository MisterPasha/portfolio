import { memo, useEffect, useId, useRef } from 'react'

// A projected Möbius surface: the illustration is generated from its geometry,
// rather than a downloaded image or a continuously running canvas animation.
function point(u: number, v: number) {
  const radius = 1.04 + v * Math.cos(u / 2)
  const x = radius * Math.cos(u), y = radius * Math.sin(u), z = v * Math.sin(u / 2)
  const y1 = y * Math.cos(1.05) - z * Math.sin(1.05)
  const z1 = y * Math.sin(1.05) + z * Math.cos(1.05)
  const x2 = x * Math.cos(-0.48) + z1 * Math.sin(-0.48)
  const depth = -x * Math.sin(-0.48) + z1 * Math.cos(-0.48)
  const projection = 196 / (1 - depth * 0.13)
  return {
    x: 300 + (x2 * Math.cos(-0.5) - y1 * Math.sin(-0.5)) * projection,
    y: 300 + (x2 * Math.sin(-0.5) + y1 * Math.cos(-0.5)) * projection,
  }
}

function curve(points: { x: number; y: number }[]) {
  return points.map((p, index) => `${index ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
}

const longitudinal = Array.from({ length: 73 }, (_, index) => {
  const v = -0.59 + index / 72 * 1.18
  return curve(Array.from({ length: 181 }, (_, i) => point(i / 180 * Math.PI * 2, v)))
})
const transverse = Array.from({ length: 65 }, (_, index) => {
  const u = index / 64 * Math.PI * 2
  return curve(Array.from({ length: 37 }, (_, i) => point(u, -0.59 + i / 36 * 1.18)))
})

function FoldedField() {
  const element = useRef<HTMLDivElement>(null)
  const id = useId().replace(/:/g, '')

  useEffect(() => {
    const art = element.current
    const surface = art?.closest('aside')
    if (!art || !surface) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    const reset = () => {
      cancelAnimationFrame(raf)
      art.style.setProperty('--field-x', '0deg')
      art.style.setProperty('--field-y', '0deg')
    }
    const move = (event: PointerEvent) => {
      if (motion.matches || event.pointerType === 'touch') return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = surface.getBoundingClientRect()
        art.style.setProperty('--field-x', `${((event.clientY - rect.top) / rect.height - 0.5) * -7}deg`)
        art.style.setProperty('--field-y', `${((event.clientX - rect.left) / rect.width - 0.5) * 10}deg`)
      })
    }
    surface.addEventListener('pointermove', move)
    surface.addEventListener('pointerleave', reset)
    motion.addEventListener('change', reset)
    return () => {
      cancelAnimationFrame(raf)
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerleave', reset)
      motion.removeEventListener('change', reset)
    }
  }, [])

  return <div className="pb-field" ref={element} aria-hidden="true">
    <svg viewBox="0 0 600 600" fill="none" className="pb-field-surface">
      <defs>
        <linearGradient id={`${id}-silver`} x1="90" y1="120" x2="480" y2="490" gradientUnits="userSpaceOnUse">
          <stop stopColor="#555c6c" /><stop offset=".26" stopColor="#dbe0df" /><stop offset=".48" stopColor="#8c909c" /><stop offset=".72" stopColor="#eeefe8" /><stop offset="1" stopColor="#525765" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="100" y1="80" x2="500" y2="500" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a1aec5" /><stop offset=".5" stopColor="#e4ddd5" /><stop offset="1" stopColor="#a4a0c4" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${id}-silver)`} strokeWidth=".6" opacity=".78">
        {longitudinal.map((path, index) => <path d={path} key={index} />)}
      </g>
      <g stroke={`url(#${id}-silver)`} strokeWidth=".45" opacity=".32">
        {transverse.map((path, index) => <path d={path} key={index} />)}
      </g>
      <g stroke={`url(#${id}-edge)`} strokeWidth="1.15" opacity=".9">
        <path d={longitudinal[0]} /><path d={longitudinal[72]} />
      </g>
    </svg>
  </div>
}

export default memo(FoldedField)
