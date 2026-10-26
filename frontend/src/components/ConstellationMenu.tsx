import { useEffect, useRef, useState } from 'react'
import './ConstellationMenu.css'

const destinations = [
  { label: 'My Skills and Projects', target: 'skills', x: 23, y: 24 },
  { label: 'My Experience', target: 'experience', x: 73, y: 19 },
  { label: 'Selected Work', target: 'projects', x: 50, y: 51 },
  { label: 'Contact Me', target: 'contact', x: 25, y: 77 },
  { label: 'PAVEL.BOT', target: 'chat', x: 76, y: 73 },
]

// A randomized spanning tree keeps every destination connected with only four threads.
function makeConnections() {
  const connected = [2]
  const remaining = [0, 1, 3, 4]
  const edges: [number, number][] = []
  while (remaining.length) {
    const next = remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0]
    const candidates = connected.filter(node => edges.filter(edge => edge.includes(node)).length < 3)
    const parent = candidates[Math.floor(Math.random() * candidates.length)]
    edges.push([parent, next])
    connected.push(next)
  }
  return edges
}

export default function ConstellationMenu({ onOpenProjects, onOpenSkills, onOpenExperience, onOpenContact, onOpenChat }: {
  onOpenProjects: () => void
  onOpenSkills: () => void
  onOpenExperience: () => void
  onOpenContact: () => void
  onOpenChat: () => void
}) {
  const fieldRef = useRef<HTMLElement>(null)
  const nodesRef = useRef<(HTMLButtonElement | null)[]>([])
  const linesRef = useRef<(SVGLineElement | null)[]>([])
  const [connections, setConnections] = useState<[number, number][]>([])
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => setConnections(makeConnections()), [])

  useEffect(() => {
    const field = fieldRef.current
    if (!field || !connections.length) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = { x: 0, y: 0, inside: false }
    const nodes = destinations.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }))
    let rect = field.getBoundingClientRect()
    let active = -1
    let visible = false
    let raf = 0
    let last = 0
    let elapsed = 0

    const locate = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      rect = field.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      pointer.inside = pointer.x >= 0 && pointer.x <= rect.width && pointer.y >= 0 && pointer.y <= rect.height
    }
    const leave = () => { pointer.inside = false }
    const bases = () => destinations.map(item => ({ x: rect.width * item.x / 100, y: rect.height * item.y / 100 }))

    const paint = (now: number) => {
      raf = 0
      if (!visible || document.hidden) { last = 0; return }
      const dt = Math.min(last ? (now - last) / 1000 : 1 / 60, 0.035)
      last = now
      elapsed += dt
      const base = bases()
      const radius = Math.min(105, rect.width * 0.2)
      if (!pointer.inside || motion.matches) active = -1
      else if (active !== -1 && Math.hypot(pointer.x - base[active].x, pointer.y - base[active].y) > radius * 1.45) active = -1
      if (active === -1 && pointer.inside && !motion.matches) {
        let nearest = radius
        base.forEach((point, index) => {
          const distance = Math.hypot(pointer.x - point.x, pointer.y - point.y)
          if (distance < nearest) { nearest = distance; active = index }
        })
      }

      const positions = base.map((origin, index) => {
        const node = nodes[index]
        let tx = motion.matches ? 0 : Math.sin(elapsed * 0.32 + index * 2.3) * 7
        let ty = motion.matches ? 0 : Math.cos(elapsed * 0.4 + index * 1.7) * 9
        if (index === active) {
          const dx = pointer.x - origin.x
          const dy = pointer.y - origin.y
          const pull = Math.min(0.85, 48 / Math.max(1, Math.hypot(dx, dy)))
          tx = dx * pull
          ty = dy * pull
        }
        const halfWidth = (nodesRef.current[index]?.offsetWidth ?? 120) / 2
        tx = Math.max(halfWidth + 4 - origin.x, Math.min(rect.width - halfWidth - 4 - origin.x, tx))
        if (motion.matches) { node.x = 0; node.y = 0; node.vx = 0; node.vy = 0 }
        else {
          node.vx += ((tx - node.x) * 85 - node.vx * 15) * dt
          node.vy += ((ty - node.y) * 85 - node.vy * 15) * dt
          node.x += node.vx * dt
          node.y += node.vy * dt
        }
        const button = nodesRef.current[index]
        if (button) {
          button.style.transform = `translate(-50%, -50%) translate(${node.x}px, ${node.y}px)`
          button.dataset.magnetic = String(index === active)
        }
        return { x: origin.x + node.x, y: origin.y + node.y }
      })
      connections.forEach(([from, to], index) => {
        const line = linesRef.current[index]
        if (!line) return
        line.setAttribute('x1', String(positions[from].x))
        line.setAttribute('y1', String(positions[from].y))
        line.setAttribute('x2', String(positions[to].x))
        line.setAttribute('y2', String(positions[to].y))
        line.dataset.active = String(from === active || to === active)
      })
      if (!motion.matches) raf = requestAnimationFrame(paint)
    }
    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(paint)
    }
    const resize = new ResizeObserver(() => { rect = field.getBoundingClientRect(); wake() })
    resize.observe(field)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) { last = 0; wake() }
    })
    observer.observe(field)
    window.addEventListener('pointermove', locate, { passive: true })
    window.addEventListener('blur', leave)
    document.addEventListener('pointerleave', leave)
    document.addEventListener('visibilitychange', wake)
    motion.addEventListener('change', wake)
    return () => {
      cancelAnimationFrame(raf)
      resize.disconnect()
      observer.disconnect()
      window.removeEventListener('pointermove', locate)
      window.removeEventListener('blur', leave)
      document.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', wake)
      motion.removeEventListener('change', wake)
    }
  }, [connections])

  const navigate = (label: string, target: string) => {
    if (target === 'chat') {
      onOpenChat()
      setAnnouncement('')
      return
    }
    if (target === 'contact') {
      onOpenContact()
      setAnnouncement('')
      return
    }
    if (target === 'experience') {
      onOpenExperience()
      setAnnouncement('')
      return
    }
    if (target === 'skills') {
      onOpenSkills()
      setAnnouncement('')
      return
    }
    if (target === 'projects') {
      onOpenProjects()
      setAnnouncement('')
      return
    }
    const section = document.getElementById(target)
    if (section) {
      section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
      setAnnouncement('')
    } else setAnnouncement(`${label} is coming soon.`)
  }

  return (
    <nav className="constellation-menu" aria-label="Explore Pavel’s portfolio" ref={fieldRef}>
      <svg className="constellation-threads" aria-hidden="true">
        {connections.map(([from, to], index) => (
          <line key={`${from}-${to}`} ref={element => { linesRef.current[index] = element }} />
        ))}
      </svg>
      {destinations.map((item, index) => (
        <button
          key={item.target}
          ref={element => { nodesRef.current[index] = element }}
          className="constellation-node"
          type="button"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
          onClick={() => navigate(item.label, item.target)}
        >
          <span className="constellation-node-index" aria-hidden="true">0{index + 1}</span>
          <span>{item.label}</span>
          <span className="constellation-node-star" aria-hidden="true">✧</span>
        </button>
      ))}
      <p className="constellation-announcement" role="status">{announcement}</p>
    </nav>
  )
}
