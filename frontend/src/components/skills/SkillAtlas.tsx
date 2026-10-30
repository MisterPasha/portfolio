import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from 'motion/react'
import {
  domains, domainsById, skills, skillsById, projects, proficiencyScale,
  linkedProjects, matchesSkill,
} from './skillsData'
import type { Domain, Project, Skill } from './skillsData'
import './SkillAtlas.css'

type Mode = 'domain' | 'project'
type Selection = { mode: Mode; id: string }
const spring = { type: 'spring' as const, stiffness: 210, damping: 26 }
const accents = ['#b9adff', '#8edcde', '#a7c6ff', '#c0c8ee', '#91c8ea', '#d3b8e1']
const accentFor = (domainId: string) => accents[Math.max(0, domains.findIndex(domain => domain.id === domainId))]
const proficiencyCopy = (skill: Skill) => proficiencyScale[skill.proficiency as keyof typeof proficiencyScale]

function DomainGlyph({ index = 0 }: { index?: number }) {
  return (
    <svg className={`atlas-glyph atlas-glyph-${index % 6}`} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <ellipse className="atlas-glyph-orbit" cx="60" cy="60" rx="53" ry="20" transform={`rotate(${index * 28 - 35} 60 60)`} />
      <ellipse className="atlas-glyph-orbit secondary" cx="60" cy="60" rx="47" ry="26" transform={`rotate(${index * 28 + 45} 60 60)`} />
      {index % 3 === 0 ? <>
        <path className="atlas-glyph-face" d="M60 18 91 42 83 82 60 103 29 79 37 39Z" />
        <path d="m60 18 0 85M37 39l46 43M91 42 29 79M37 39l54 3-31 61" />
      </> : index % 3 === 1 ? <>
        <path className="atlas-glyph-face" d="m60 24 34 20v36L60 100 26 80V44Z" />
        <path d="m26 44 34 20 34-20M60 64v36M43 34l34 20v36M26 62l34 20 34-20" />
      </> : <>
        <path className="atlas-glyph-face" d="m60 17 35 43-35 43-35-43Z" />
        <path d="m60 17 12 43-12 43-12-43 12-43ZM25 60h70M35 47h50M35 73h50" />
      </>}
      <circle cx="60" cy="60" r="4" className="atlas-glyph-core" />
    </svg>
  )
}

function ProjectLinks({ project }: { project: Project }) {
  return (
    <div className="atlas-project-links">
      {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer">
        {project.projectType === 'team' ? 'Team repository' : 'View GitHub'} <span aria-hidden="true">↗</span>
      </a>}
      {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer">Visit site <span aria-hidden="true">↗</span></a>}
      {project.credentialUrl && <a href={project.credentialUrl} target="_blank" rel="noreferrer">View certificate <span aria-hidden="true">↗</span></a>}
    </div>
  )
}

function tilt(event: ReactPointerEvent<HTMLButtonElement>) {
  if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const bounds = event.currentTarget.getBoundingClientRect()
  const x = (event.clientX - bounds.left) / bounds.width - 0.5
  const y = (event.clientY - bounds.top) / bounds.height - 0.5
  event.currentTarget.style.setProperty('--tilt-x', `${-y * 13}deg`)
  event.currentTarget.style.setProperty('--tilt-y', `${x * 13}deg`)
  event.currentTarget.style.setProperty('--shine-x', `${(x + 0.5) * 100}%`)
  event.currentTarget.style.setProperty('--shine-y', `${(y + 0.5) * 100}%`)
}

function resetTilt(event: ReactPointerEvent<HTMLButtonElement>) {
  event.currentTarget.style.setProperty('--tilt-x', '0deg')
  event.currentTarget.style.setProperty('--tilt-y', '0deg')
}

function SkillDetail({ skill, onClose, onProject }: {
  skill: Skill; onClose: () => void; onProject: (project: Project) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const reduced = useReducedMotion()
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog?.showModal()
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      previousFocus?.focus({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <dialog
      ref={dialogRef}
      className="atlas-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
      style={{ '--atlas-accent': accentFor(skill.domainId) } as CSSProperties}
    >
      <motion.div className="atlas-detail-windows" initial={{ opacity: 0, y: reduced ? 0 : 28, scale: reduced ? 1 : 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}>
        <article className="atlas-detail-primary atlas-glass">
          <div className="atlas-window-bar"><span><i /> SKILL / IN FOCUS</span><button autoFocus type="button" onClick={onClose} aria-label="Close skill details">×</button></div>
          <div className="atlas-detail-copy">
            <p className="atlas-eyebrow">{domainsById.get(skill.domainId)?.name}</p>
            <div className="atlas-detail-emblem"><DomainGlyph index={domains.findIndex(domain => domain.id === skill.domainId)} /></div>
            <h3 id={titleId}>{skill.name}</h3>
            <p className="atlas-proficiency"><span /> {skill.proficiency}<span className="atlas-proficiency-note">{proficiencyCopy(skill)}</span></p>
            <p id={descriptionId} className="atlas-personal-description">{skill.description}</p>
            <span className="atlas-detail-footnote">EXPLORATION → APPLICATION</span>
          </div>
        </article>
        <section className="atlas-detail-evidence atlas-glass" aria-label="Projects using this skill">
          <div className="atlas-window-bar"><span>PUT INTO PRACTICE</span><span>{String(skill.projectIds.length).padStart(2, '0')} PROJECTS</span></div>
          <div className="atlas-evidence-list">
            {linkedProjects(skill).map(project => (
              <article className="atlas-evidence-project" key={project.id}>
                <span className="atlas-project-type">{project.projectType} project</span>
                <h4>{project.name}</h4>
                <p>{project.summary}</p>
                <ProjectLinks project={project} />
                {project.credentialUrl && <p className="atlas-credential-note">Certificate: additional learning alongside the project.</p>}
                <button className="atlas-text-button" type="button" onClick={() => onProject(project)}>Explore this project’s skills <span aria-hidden="true">→</span></button>
              </article>
            ))}
          </div>
        </section>
      </motion.div>
    </dialog>, document.body,
  )
}

function SkillNetwork({ selection, query, onSkill, onBack }: {
  selection: Selection; query: string; onSkill: (skill: Skill) => void; onBack: () => void
}) {
  const reduced = useReducedMotion()
  const graphRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const skillRefs = useRef(new Map<string, HTMLButtonElement>())
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [paths, setPaths] = useState<{ id: string; d: string; color: string }[]>([])
  const isDomain = selection.mode === 'domain'
  const source = (isDomain ? domains : projects).find(item => item.id === selection.id)!
  const project = isDomain ? null : source as Project
  const activeSkills = source.skillIds.map(id => skillsById.get(id)!).filter(skill => matchesSkill(skill, query))
  const groups = isDomain
    ? [{ domain: source as Domain, skills: activeSkills }]
    : domains.map(domain => ({ domain, skills: activeSkills.filter(skill => skill.domainId === domain.id) })).filter(group => group.skills.length)
  const color = isDomain ? accentFor(source.id) : '#bac9ef'

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [selection.id, selection.mode])

  useLayoutEffect(() => {
    const graph = graphRef.current
    const root = rootRef.current
    if (!graph || !root) return
    const measure = () => {
      // Use layout coordinates so staggered scale animations don't shift wire endpoints.
      const position = (element: HTMLElement) => {
        let left = 0
        let top = 0
        let current: HTMLElement | null = element
        while (current && current !== graph) {
          left += current.offsetLeft
          top += current.offsetTop
          current = current.offsetParent as HTMLElement | null
        }
        return { left, top, width: element.offsetWidth, height: element.offsetHeight }
      }
      const origin = position(root)
      const mobile = window.matchMedia('(max-width: 740px)').matches
      const sx = mobile ? origin.left + origin.width / 2 : origin.left + origin.width
      const sy = mobile ? origin.top + origin.height : origin.top + origin.height / 2
      setPaths(activeSkills.flatMap(skill => {
        const node = skillRefs.current.get(skill.id)
        if (!node) return []
        const end = position(node)
        const ex = end.left
        const ey = end.top + end.height / 2
        const bend = Math.max(45, (ex - sx) * 0.5)
        // On narrow screens the wires run beside the stack rather than through its text.
        const d = mobile ? `M${sx},${sy} C${sx},${sy + 25} -7,${sy + 15} -7,${sy + 45} L-7,${ey - 12} Q-7,${ey} ${ex},${ey}` : `M${sx},${sy} C${sx + bend},${sy} ${ex - bend},${ey} ${ex},${ey}`
        return [{ id: skill.id, d, color: accentFor(skill.domainId) }]
      }))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(graph)
    observer.observe(root)
    skillRefs.current.forEach(node => observer.observe(node))
    // Layout motion settles before measuring connection endpoints.
    const timeout = window.setTimeout(measure, reduced ? 0 : 550)
    measure()
    return () => { observer.disconnect(); window.clearTimeout(timeout) }
  }, [selection.id, selection.mode, query, reduced])

  let skillIndex = 0
  return (
    <motion.div className="atlas-network-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }}>
      <div className="atlas-network-toolbar">
        <button className="atlas-text-button" onClick={onBack} type="button">← All {isDomain ? 'domains' : 'projects'}</button>
        <span>{activeSkills.length} CONNECTED SKILLS</span>
      </div>
      <div className="atlas-network" ref={graphRef}>
        <svg className="atlas-wires" aria-hidden="true">
          {paths.map((path, index) => <motion.path key={`${selection.mode}-${selection.id}-${path.id}`} d={path.d} stroke={path.color} initial={{ pathLength: reduced ? 1 : 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }} transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.15 + index * 0.035 }} />)}
        </svg>
        <motion.div ref={rootRef} className="atlas-source atlas-glass" layoutId={`atlas-${selection.mode}-${source.id}`} style={{ '--atlas-accent': color } as CSSProperties} transition={spring}>
          <span className="atlas-eyebrow">{isDomain ? 'DOMAIN' : `${project?.projectType} PROJECT`} / IN FOCUS</span>
          <DomainGlyph index={isDomain ? domains.findIndex(domain => domain.id === source.id) : 3} />
          <h3 tabIndex={-1} ref={headingRef}>{source.name}</h3>
          <p>{isDomain ? (source as Domain).description : project?.summary}</p>
          {project && <ProjectLinks project={project} />}
          {project?.credentialUrl && <p className="atlas-credential-note">Additional learning credential</p>}
          <span className="atlas-source-count">{source.skillIds.length} skills in this {isDomain ? 'domain' : 'project'}</span>
        </motion.div>
        <div className="atlas-branches">
          {groups.map(group => (
            <div className="atlas-skill-group" key={group.domain.id} style={{ '--atlas-accent': accentFor(group.domain.id) } as CSSProperties}>
              {!isDomain && <h4><span />{group.domain.name}</h4>}
              <div className="atlas-skill-grid">
                {group.skills.map(skill => {
                  const index = skillIndex++
                  return (
                    <motion.button
                      key={skill.id}
                      className="atlas-skill-node atlas-glass"
                      ref={node => { if (node) skillRefs.current.set(skill.id, node); else skillRefs.current.delete(skill.id) }}
                      type="button" onClick={() => onSkill(skill)} aria-haspopup="dialog"
                      initial={{ opacity: 0, scale: reduced ? 1 : 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...spring, delay: reduced ? 0 : 0.35 + index * 0.045 }}
                    >
                      <span className="atlas-skill-port" aria-hidden="true" />
                      <span className="atlas-skill-node-copy"><strong>{skill.name}</strong><small>{skill.proficiency} <span>· {skill.projectIds.length} {skill.projectIds.length === 1 ? 'project' : 'projects'}</span></small></span>
                      <span className="atlas-expand" aria-hidden="true">↗</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
          {!activeSkills.length && <div className="atlas-empty"><span aria-hidden="true">◇</span><h3>No matching skills here.</h3><p>Try another search, or clear the search to see every connection.</p></div>}
        </div>
      </div>
    </motion.div>
  )
}

export default function SkillAtlas({ initialMode = 'domain' }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [domainId, setDomainId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [focusedSkill, setFocusedSkill] = useState<Skill | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const explorerRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const selectionId = mode === 'domain' ? domainId : projectId
  const selection = selectionId ? { mode, id: selectionId } : null
  const roots = mode === 'domain' ? domains : projects
  const normalizedQuery = query.trim().toLowerCase()
  const filteredRoots = roots.filter(root => [root.name, 'description' in root ? root.description : root.summary].join(' ').toLowerCase().includes(normalizedQuery) || root.skillIds.some(id => matchesSkill(skillsById.get(id)!, query)))

  const selectRoot = (id: string) => {
    if (mode === 'domain') setDomainId(id)
    else setProjectId(id)
    setQuery('')
    window.requestAnimationFrame(() => explorerRef.current?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' }))
  }
  const back = () => {
    const id = selectionId
    if (mode === 'domain') setDomainId(null)
    else setProjectId(null)
    setQuery('')
    window.setTimeout(() => explorerRef.current?.querySelector<HTMLButtonElement>(`[data-root-id="${id}"]`)?.focus({ preventScroll: true }), reduced ? 0 : 300)
  }
  const openProject = (project: Project) => {
    setFocusedSkill(null)
    setMode('project')
    setProjectId(project.id)
    setQuery('')
    window.requestAnimationFrame(() => explorerRef.current?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' }))
  }

  return (
    <MotionConfig reducedMotion="user">
      <section className="skill-atlas" id="skills" aria-labelledby="skills-heading">
        <div className="atlas-space" aria-hidden="true"><div className="atlas-distant-orbit" /><div className="atlas-distant-orbit second" /></div>
        <div className="atlas-content">
          <header className="atlas-intro">
            <div className="atlas-intro-meta"><span className="atlas-eyebrow"><i /> MY SKILLS / THE ATLAS</span><span>ALWAYS EXPLORING</span></div>
            <h2 id="skills-heading">Too many interesting things<br />to <span>pick just one.</span></h2>
            <div className="atlas-intro-body">
              <span className="atlas-intro-mark" aria-hidden="true">✳</span>
              <div>
                <p>Computer science is a vast field, and I’ve always found it difficult to choose just one favourite area. I started with the foundations: statistics, probability, linear algebra and calculus. And followed my curiosity into everything from ML-powered wearable systems to data pipelines, cloud infrastructure and software architecture.</p>
                <p>Along the way, I’ve come to appreciate not only the individual technologies, but also how they connect to build complete systems.</p>
                <p className="atlas-intro-emphasis">Here’s what I’ve explored, learned and put into practice.</p>
              </div>
            </div>
          </header>
          <div className="atlas-explorer" id="skills-cards" ref={explorerRef}>
            <div className="atlas-controls">
              <div className="atlas-perspective" role="group" aria-label="Skills perspective">
                <button type="button" aria-pressed={mode === 'domain'} onClick={() => { setMode('domain'); setQuery('') }}><span aria-hidden="true">◈</span> Domain <span aria-hidden="true">→</span> skills</button>
                <button type="button" aria-pressed={mode === 'project'} onClick={() => { setMode('project'); setQuery('') }}><span aria-hidden="true">⌘</span> Project <span aria-hidden="true">→</span> skills</button>
              </div>
              <label className="atlas-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search skills, descriptions or projects" placeholder={selection ? 'Find a connected skill…' : `Explore ${mode === 'domain' ? 'domains' : 'projects'}…`} value={query} onChange={event => setQuery(event.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="Clear search" type="button">×</button>}</label>
            </div>
            <div className="atlas-stage-meta" aria-live="polite"><span>{selection ? 'FOLLOW THE CONNECTIONS' : mode === 'domain' ? 'CHOOSE A DOMAIN TO EXPLORE' : 'CHOOSE A PROJECT TO EXPLORE'}</span><span>{domains.length} domains <b>·</b> {skills.length} skills <b>·</b> {projects.length} projects</span></div>
            <LayoutGroup id="skills-atlas">
              <AnimatePresence mode="wait" initial={false}>
                {selection ? <SkillNetwork key={`${selection.mode}-${selection.id}`} selection={selection} query={query} onBack={back} onSkill={skill => { triggerRef.current = document.activeElement as HTMLButtonElement; setFocusedSkill(skill) }} /> : (
                  <motion.div className={`atlas-root-grid ${mode === 'project' ? 'is-projects' : ''}`} key={`${mode}-roots`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
                    {filteredRoots.map((root, index) => {
                      const domain = mode === 'domain' ? root as Domain : null
                      const project = mode === 'project' ? root as Project : null
                      const color = domain ? accentFor(domain.id) : accents[index % accents.length]
                      return (
                        <motion.div className="atlas-root-position" key={root.id} initial={{ opacity: 0, y: reduced ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: reduced ? 0 : index * 0.045 }}>
                          <motion.button
                            className={`atlas-root ${domain ? 'is-domain' : 'is-project'}`}
                            type="button" onClick={() => selectRoot(root.id)} data-root-id={root.id}
                            onPointerMove={tilt} onPointerLeave={resetTilt}
                            layoutId={`atlas-${mode}-${root.id}`} transition={spring}
                            style={{ '--atlas-accent': color, '--root-index': index } as CSSProperties}
                          >
                            <span className="atlas-root-surface">
                              <span className="atlas-root-top"><span>{String(index + 1).padStart(2, '0')} / {domain ? 'DOMAIN' : project?.projectType.toUpperCase()}</span><span className="atlas-root-arrow" aria-hidden="true">↗</span></span>
                              <DomainGlyph index={domain ? domains.findIndex(item => item.id === domain.id) : index} />
                              <span className="atlas-root-name">{root.name}</span>
                              <span className="atlas-root-description">{domain ? domain.description : project?.summary}</span>
                              <span className="atlas-root-bottom"><span>{root.skillIds.length} connected skills</span><span aria-hidden="true">＋</span></span>
                            </span>
                          </motion.button>
                        </motion.div>
                      )
                    })}
                    {!filteredRoots.length && <div className="atlas-empty"><span aria-hidden="true">◇</span><h3>No signals found.</h3><p>Try a skill, a project name, or a different search.</p><button type="button" className="atlas-text-button" onClick={() => setQuery('')}>Clear search →</button></div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </LayoutGroup>
            <footer className="atlas-footer"><span><i /> CURIOSITY IS THE COMMON THREAD.</span><span>{selection ? 'Select a skill to see it in practice.' : 'Select a signal. See where it leads.'}</span></footer>
          </div>
        </div>
        {focusedSkill && <SkillDetail skill={focusedSkill} onClose={() => { setFocusedSkill(null); window.requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true })) }} onProject={openProject} />}
      </section>
    </MotionConfig>
  )
}
