import { useState } from 'react'
import AeroShards from '@/components/AeroShards'
import { experienceEntries, experienceSubtitle, ownershipMessage } from './experienceData'
import './ExperienceSection.css'

type View = 'overview' | 'responsibilities' | 'reflection' | 'context'

export default function ExperienceSection({ onOpenProjects, onOpenSkills }: {
  onOpenProjects: () => void
  onOpenSkills: () => void
}) {
  const [shardsFailed, setShardsFailed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [view, setView] = useState<View>('overview')
  const entry = experienceEntries[activeIndex]
  const independent = entry.id === 'independent'
  const views: { id: Exclude<View, 'context'>; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'responsibilities', label: independent ? 'Explore' : 'Responsibilities' },
    { id: 'reflection', label: independent ? 'Perspective' : 'Reflection' },
  ]

  const chooseEntry = (index: number) => {
    setActiveIndex(index)
    setView('overview')
  }

  return (
    <section className="experience-section" id="experience" aria-labelledby="experience-heading" data-renderer={shardsFailed ? 'fallback' : 'webgpu'}>
      <div className="experience-background" aria-hidden="true">
        {shardsFailed ? (
          <div className="experience-shards-fallback">
            {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
          </div>
        ) : (
          <AeroShards
            shardColor="#9cc9ff"
            accentColor="#38bdf8"
            placement="right"
            material="glass"
            markers="none"
            count={500}
            depthOfField={0.6}
            vignette={0.15}
            mouseInteraction
            pulseOnClick
            holdToGather
            shardSize={1.25}
            spread={1.07}
            billow={1.01}
            speed={0.8}
            scale={1.02}
            glow={0.33}
            grain={0.09}
            parallax={0.51}
            onError={error => {
              console.warn('AeroShards background unavailable:', error)
              setShardsFailed(true)
            }}
          />
        )}
      </div>
      <div className="experience-content">
        <div className="experience-sidebar">
          <header className="experience-intro">
            <p className="experience-kicker">PAVEL / MY EXPERIENCE</p>
            <h2 id="experience-heading">Where I’ve<br /><span>Taken Ownership.</span></h2>
            <p className="experience-subtitle">{experienceSubtitle}</p>
            <button className="experience-context-button" type="button" aria-pressed={view === 'context'} onClick={() => setView(view === 'context' ? 'overview' : 'context')}>What connects these experiences? <span aria-hidden="true">↗</span></button>
          </header>
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
            {views.map(item => <button key={item.id} type="button" aria-pressed={view === item.id} aria-controls="experience-panel-body" onClick={() => setView(item.id)}>{item.label}</button>)}
          </div>

          <div className="experience-panel-body" id="experience-panel-body" key={`${entry.id}-${view}`}>
            {view === 'context' && <div className="experience-story"><p>{experienceSubtitle}</p><p className="experience-ownership-message">{ownershipMessage}</p></div>}
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

          <footer className="experience-panel-footer">
            <button type="button" onClick={onOpenProjects}>Explore Projects <span aria-hidden="true">→</span></button>
            <button type="button" onClick={onOpenSkills}>Explore Skills <span aria-hidden="true">→</span></button>
          </footer>
        </article>
      </div>
    </section>
  )
}
