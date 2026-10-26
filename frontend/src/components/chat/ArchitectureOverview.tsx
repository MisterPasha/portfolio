import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import ChatIcon from './ChatIcon'
import { architectureEdges, architectureNodes, conversationNodes, preparationNodes, safetyFeatures } from './pavelBotArchitecture'
import type { ArchitectureNode, ArchitectureNodeId, SafetyFeature } from './pavelBotArchitecture'
import './ArchitectureOverview.css'

function ArchitectureCard({ node, selected, active, related, onSelect, onPreview, onFocusNode, setRef }: {
  node: ArchitectureNode
  selected: boolean
  active: boolean
  related: boolean
  onSelect: () => void
  onPreview: (preview: boolean) => void
  onFocusNode: (focused: boolean) => void
  setRef: (element: HTMLButtonElement | null) => void
}) {
  return <button ref={setRef} type="button" className="pa-node" data-node={node.id} data-tone={node.tone}
    data-active={active} data-related={related} aria-pressed={selected} aria-describedby="pavelbot-node-detail"
    onClick={onSelect} onPointerEnter={() => onPreview(true)} onPointerLeave={() => onPreview(false)}
    onFocus={() => onFocusNode(true)} onBlur={() => onFocusNode(false)}>
    <span className="pa-node-icon"><ChatIcon name={node.icon} size={23} /></span>
    <span className="pa-node-number" aria-hidden="true">{node.step}</span>
    <span className="pa-node-copy"><span className="pa-node-title">{node.title}</span>
      <span className="pa-node-caption">{node.operations
        ? <span className="pa-operations">{node.operations.map((operation, index) => <span key={operation}>{index > 0 && <i aria-hidden="true">→</i>}{operation}</span>)}</span>
        : node.caption}</span>
      <span className="pa-node-mobile-role">{node.role}</span>
    </span>
  </button>
}

function SafetyCard({ feature }: { feature: SafetyFeature }) {
  return <article className="pa-safety-card" data-tone={feature.tone}>
    <ChatIcon name={feature.icon} size={21} />
    <div><h4>{feature.title}</h4><p>{feature.description}</p></div>
  </article>
}

function ArchitectureDiagram({ open }: { open: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  const nodes = useRef<Partial<Record<ArchitectureNodeId, HTMLButtonElement | null>>>({})
  const [selected, setSelected] = useState<ArchitectureNodeId>('search')
  const [preview, setPreview] = useState<ArchitectureNodeId | null>(null)
  const [focused, setFocused] = useState<ArchitectureNodeId | null>(null)
  const [paths, setPaths] = useState<Record<string, string>>({})
  const markerId = useId().replace(/:/g, '')
  const active = preview || focused || selected
  const activeNode = architectureNodes.find(node => node.id === active)!
  const related = new Set(architectureEdges.filter(edge => edge.from === active || edge.to === active).flatMap(edge => [edge.from, edge.to]))

  useLayoutEffect(() => {
    if (!open || !frame.current) return
    const element = frame.current
    let raf = 0
    const measure = () => {
      const base = element.getBoundingClientRect()
      const vertical = window.matchMedia('(max-width: 780px)').matches
      const next: Record<string, string> = {}
      for (const edge of architectureEdges) {
        const from = nodes.current[edge.from]?.getBoundingClientRect()
        const to = nodes.current[edge.to]?.getBoundingClientRect()
        if (!from || !to || !from.width || !to.width) continue
        if (edge.bidirectional) {
          if (vertical) {
            const x1 = from.left - base.left - 1, y1 = from.top + from.height / 2 - base.top
            const x2 = to.left - base.left - 1, y2 = to.top + to.height / 2 - base.top
            const rail = Math.min(x1, x2) - 22
            next[edge.id] = `M ${x1} ${y1} H ${rail + 7} Q ${rail} ${y1} ${rail} ${y1 - 7} V ${y2 + 7} Q ${rail} ${y2} ${rail + 7} ${y2} H ${x2}`
          } else {
            const x1 = from.left + from.width / 2 - base.left, y1 = from.top - base.top - 1
            const x2 = to.left + to.width / 2 - base.left, y2 = to.bottom - base.top + 1
            const middle = (y1 + y2) / 2
            next[edge.id] = `M ${x1} ${y1} C ${x1} ${middle} ${x2} ${middle} ${x2} ${y2}`
          }
        } else if (vertical) {
          const x1 = from.left + from.width / 2 - base.left, y1 = from.bottom - base.top + 2
          const x2 = to.left + to.width / 2 - base.left, y2 = to.top - base.top - 3
          next[edge.id] = `M ${x1} ${y1} L ${x2} ${y2}`
        } else {
          const x1 = from.right - base.left + 2, y1 = from.top + from.height / 2 - base.top
          const x2 = to.left - base.left - 3, y2 = to.top + to.height / 2 - base.top
          next[edge.id] = `M ${x1} ${y1} L ${x2} ${y2}`
        }
      }
      setPaths(next)
    }
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure) }
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    Object.values(nodes.current).forEach(node => { if (node) observer.observe(node) })
    window.addEventListener('resize', schedule)
    schedule()
    return () => { cancelAnimationFrame(raf); observer.disconnect(); window.removeEventListener('resize', schedule) }
  }, [open])

  const card = (node: ArchitectureNode) => <ArchitectureCard key={node.id} node={node}
    selected={selected === node.id} active={active === node.id} related={related.has(node.id)}
    onSelect={() => setSelected(node.id)} onPreview={hovering => setPreview(hovering ? node.id : null)}
    onFocusNode={hasFocus => setFocused(hasFocus ? node.id : null)}
    setRef={element => { nodes.current[node.id] = element }} />

  return <section className="pa-architecture" aria-label="Interactive PAVEL.BOT architecture">
    <div className="pa-diagram" ref={frame}>
      <svg className="pa-connections" aria-hidden="true">
        <defs>{['storage', 'processing', 'retrieval', 'generation'].map(tone => <marker key={tone}
          id={`${markerId}-${tone}`} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="m1 1 5 3-5 3" fill="none" stroke="currentColor" strokeWidth="1.3" data-tone={tone} />
        </marker>)}</defs>
        {architectureEdges.map(edge => <g key={edge.id} data-edge={edge.id} data-tone={edge.tone}
          data-active={edge.from === active || edge.to === active}>
          <path className="pa-wire" d={paths[edge.id] || ''} markerEnd={`url(#${markerId}-${edge.tone})`}
            markerStart={edge.bidirectional ? `url(#${markerId}-${edge.tone})` : undefined} />
          <path className="pa-packet" d={paths[edge.id] || ''} />
        </g>)}
      </svg>
      <div className="pa-lane pa-lane--preparation">
        <h3><span>01</span>Knowledge Preparation</h3>
        <div className="pa-preparation-nodes">{preparationNodes.map(card)}</div>
      </div>
      <div className="pa-query-label"><span>Question vector ↑</span><span>Approved text ↓</span></div>
      <div className="pa-lane pa-lane--conversation">
        <h3><span>02</span>Question &amp; Answer</h3>
        <div className="pa-conversation-nodes">{conversationNodes.map(card)}</div>
      </div>
    </div>
    <div className="pa-node-detail" id="pavelbot-node-detail" data-tone={activeNode.tone} aria-live="polite" aria-atomic="true">
      <ChatIcon name={activeNode.icon} size={20} /><div><strong>{activeNode.title}</strong><p>{activeNode.role}</p></div>
      <span className="pa-explore-hint">Select a component<br />to explore its role</span>
    </div>
    <p className="pa-text-note"><ChatIcon name="code" size={16} /><span><strong>Vectors find the context. Text goes to the model.</strong> The LLM receives retrieved passages, not embedding vectors.</span></p>
  </section>
}

export default function ArchitectureOverview({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [closing, setClosing] = useState(false)

  const requestClose = useCallback(() => {
    if (timer.current) return
    setClosing(true)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    timer.current = setTimeout(() => { timer.current = null; onClose() }, reduced ? 0 : 180)
  }, [onClose])

  useEffect(() => {
    if (!open || !dialog.current) return
    const element = dialog.current
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    setClosing(false)
    document.body.style.overflow = 'hidden'
    element.showModal()
    return () => {
      if (timer.current) { clearTimeout(timer.current); timer.current = null }
      element.close()
      document.body.style.overflow = previousOverflow
      trigger?.focus({ preventScroll: true })
    }
  }, [open])

  const trapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab' || !dialog.current) return
    const controls = [...dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],[tabindex="0"]')]
      .filter(element => element.getClientRects().length > 0)
    const first = controls[0], last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }

  return <dialog ref={dialog} id="pavelbot-build-overview" className={`pa-overview${closing ? ' is-closing' : ''}`} aria-labelledby="pavelbot-build-title"
    onCancel={event => { event.preventDefault(); requestClose() }} onKeyDown={trapFocus}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose()
    }}>
    <div className="pa-dialog-shell">
      <header className="pa-header">
        <div><span className="pa-header-mark" aria-hidden="true"><ChatIcon name="processor" size={19} /></span><h2 id="pavelbot-build-title">How I built <span>PAVEL.BOT</span></h2></div>
        <button type="button" className="pa-close" autoFocus onClick={requestClose} aria-label="Close architecture overview"><ChatIcon name="close" size={20} /></button>
      </header>
      <div className="pa-body">
        <div className="pa-intro"><p>PAVEL.BOT uses a RAG pipeline. My knowledge files are parsed, chunked, embedded, and stored in a vector database.</p><p>When a user asks a question, the system retrieves the most relevant chunks and feeds them to the language model to generate a grounded answer.</p></div>
        <ArchitectureDiagram open={open} />
        <section className="pa-safety" aria-labelledby="pavelbot-safety-title"><h3 id="pavelbot-safety-title">Safety &amp; Control Features</h3><div className="pa-safety-grid">{safetyFeatures.map(feature => <SafetyCard key={feature.title} feature={feature} />)}</div></section>
      </div>
    </div>
  </dialog>
}
