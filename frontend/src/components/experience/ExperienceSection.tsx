import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import GhostFibers from '@/components/GhostFibers'
import { experienceEntries } from './experienceData'
import './ExperienceSection.css'

type View = 'overview' | 'responsibilities' | 'reflection'

export default function ExperienceSection({ onOpenProjects, onOpenSkills }: {
  onOpenProjects: () => void
  onOpenSkills: () => void
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [view, setView] = useState<View>('overview')
  const [detailPage, setDetailPage] = useState(0)
  const [pagination, setPagination] = useState({ pages: 1, stride: 0 })
  const bodyViewportRef = useRef<HTMLDivElement>(null)
  const bodyFlowRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const visiblePage = Math.min(detailPage, pagination.pages - 1)
  const entry = experienceEntries[activeIndex]
  const independent = entry.id === 'independent'
  const views: { id: View; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'responsibilities', label: independent ? 'Explore' : 'Responsibilities' },
    { id: 'reflection', label: independent ? 'Perspective' : 'Reflection' },
  ]

  const chooseEntry = (index: number) => {
    setActiveIndex(index)
    setView('overview')
    setDetailPage(0)
  }

  const chooseView = (nextView: View) => {
    setView(nextView)
    setDetailPage(0)
  }

  useLayoutEffect(() => {
    const viewport = bodyViewportRef.current
    const flow = bodyFlowRef.current
    if (!viewport || !flow) return
    viewport.scrollTop = 0

    let active = true
    const measure = () => {
      if (!active || !viewport.clientWidth || !viewport.clientHeight) return
      const flowStyle = getComputedStyle(flow)
      const gap = Number.parseFloat(flowStyle.columnGap) || 0
      const stride = viewport.clientWidth + gap
      const pages = flowStyle.columnCount === 'auto'
        ? 1
        : Math.max(1, Math.ceil((flow.scrollWidth + gap - 1) / stride))
      setPagination(previous => previous.pages === pages && previous.stride === stride
        ? previous
        : { pages, stride })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    const frame = requestAnimationFrame(measure)
    void document.fonts.ready.then(measure)
    document.fonts.addEventListener('loadingdone', measure)
    return () => {
      active = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.fonts.removeEventListener('loadingdone', measure)
    }
  }, [activeIndex, view])

  return (
    <section className="experience-section" id="experience" aria-labelledby="experience-heading">
      <div className="experience-background" aria-hidden="true">
        <GhostFibers
          glowColor="#f97316"
          lineColor="#ecfdf5"
          secondaryColor="#eab308"
          layers={2}
          twist={1}
          threads={56}
          fiberStyle="lines"
          depthOfField={0.4}
          hoverEffect="focus"
          intro={!reducedMotion}
          paused={!!reducedMotion}
          mouseInteraction={!reducedMotion}
          pulseOnClick={false}
          waves={1.5}
          volume={0.75}
          spread={1.1}
          rotation={-49}
          foldGlow={2}
          speed={0.3}
          flow={0.35}
          particles={0.35}
          sparkle={0.2}
          glow={0.4}
          vignette={0.5}
          mouseStrength={0.4}
          dpr={1.25}
        />
      </div>
      <div className="experience-content">
        <header className="experience-intro">
          <p className="experience-kicker">PAVEL / MY EXPERIENCE</p>
          <h2 id="experience-heading">Where I’ve<br /><span>Taken Ownership.</span></h2>
        </header>

        <div className="experience-workspace">
          <div className="experience-sidebar">
            <div className="experience-entry-list" role="group" aria-label="Choose an experience">
              {experienceEntries.map((item, index) => (
                <button type="button" key={item.id} onClick={() => chooseEntry(index)} aria-pressed={activeIndex === index} aria-controls="experience-panel" className="experience-entry-button">
                  <span className="experience-entry-number">0{index + 1}</span>
                  <span><strong>{item.role}</strong><small>{item.project ?? item.duration ?? 'Learning, experimenting & building'}</small></span>
                  <span className="experience-entry-arrow" aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <label className="experience-mobile-chooser">
              <span>CHOOSE AN EXPERIENCE</span>
              <select aria-label="Choose an experience" value={activeIndex} onChange={event => chooseEntry(Number(event.target.value))}>
                {experienceEntries.map((item, index) => <option key={item.id} value={index}>0{index + 1} · {item.role}</option>)}
              </select>
            </label>
          </div>

          <article className="experience-panel" id="experience-panel" aria-labelledby="experience-entry-heading" data-view={view}>
            <header className="experience-panel-header">
              <div className="experience-panel-meta"><span>0{activeIndex + 1} / {entry.category}</span>{entry.duration && <span>{entry.duration}</span>}</div>
              <h3 id="experience-entry-heading">{entry.role}</h3>
              <p className="experience-entry-title">{entry.title}</p>
              {entry.project && <p className="experience-project">{entry.project}</p>}
            </header>

            <div className="experience-view-switcher" role="group" aria-label="Experience details">
              {views.map(item => <button key={item.id} type="button" aria-pressed={view === item.id} aria-controls="experience-panel-body" onClick={() => chooseView(item.id)}>{item.label}</button>)}
            </div>

            <div className="experience-body-viewport" key={`${entry.id}-${view}`} ref={bodyViewportRef} tabIndex={0} role="region" aria-label="Experience details">
              <div className="experience-panel-body" id="experience-panel-body" ref={bodyFlowRef} style={{ '--experience-page-offset': `-${visiblePage * pagination.stride}px` } as CSSProperties}>
                {view === 'overview' && <>
                  <div className="experience-story"><p>{entry.overview}</p>{independent && <p>{entry.learning}</p>}</div>
                  {!independent && <div className="experience-strengths-block">
                    <p className="experience-body-label">STRENGTHS I BRING</p>
                    <ul className="experience-strengths">{entry.strengths.map(strength => <li key={strength}>{strength}</li>)}</ul>
                  </div>}
                </>}
                {view === 'responsibilities' && (independent ? <div className="experience-story"><p>{entry.explore}</p></div> : <>
                  <p className="experience-body-label">KEY RESPONSIBILITIES</p>
                  <ul className="experience-responsibilities">
                    {entry.responsibilities.map(responsibility => <li key={responsibility}>{responsibility}</li>)}
                  </ul>
                </>)}
                {view === 'reflection' && <div className="experience-reflection">{entry.reflection && <p>{entry.reflection}</p>}<blockquote>{entry.insight}</blockquote></div>}
              </div>
            </div>

            <div className="experience-body-pagination" data-paginated={pagination.pages > 1} role="group" aria-label="Detail pages">
              <button type="button" aria-label="Previous detail page" aria-controls="experience-panel-body" disabled={visiblePage === 0} onClick={() => setDetailPage(visiblePage - 1)}><span aria-hidden="true">←</span></button>
              <span role="status" aria-label={`Details page ${visiblePage + 1} of ${pagination.pages}`}>{visiblePage + 1} / {pagination.pages}</span>
              <button type="button" aria-label="Next detail page" aria-controls="experience-panel-body" disabled={visiblePage === pagination.pages - 1} onClick={() => setDetailPage(visiblePage + 1)}><span aria-hidden="true">→</span></button>
            </div>

            <footer className="experience-panel-footer">
              <button type="button" onClick={onOpenProjects}>Explore Projects <span aria-hidden="true">→</span></button>
              <button type="button" onClick={onOpenSkills}>Explore Skills <span aria-hidden="true">→</span></button>
            </footer>
          </article>
        </div>
      </div>
    </section>
  )
}
