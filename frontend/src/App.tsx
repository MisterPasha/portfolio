import { lazy, Suspense, useEffect, useState } from 'react'
import { animate } from 'motion'
import './App.css'
import FuzzyText from '@/components/FuzzyText'
import GradientText from '@/components/GradientText'
import GradientWaves from '@/components/GradientWaves'
import GradientASCII from '@/components/GradientASCII'
import ConstellationMenu from '@/components/ConstellationMenu'
import Particles from '@/components/Particles'
import HarCaseStudy from '@/components/har/HarCaseStudy'
import DigisoftCaseStudy from '@/components/digisoft/DigisoftCaseStudy'
import meImage from '@/assets/me.png'

const SkillAtlas = lazy(() => import('@/components/skills/SkillAtlas'))
const ExperienceSection = lazy(() => import('@/components/experience/ExperienceSection'))
const ContactSection = lazy(() => import('@/components/contact/ContactSection'))

const projectItems = [
  'ACTIVITY RECOGNITION',
  'DIGISOFT',
  'DATA PIPELINE',
]
const statusRows = [
  { key: 'name', value: 'Pavel Jermolajev', hint: 'People refer to me as Pav' },
  { key: 'location', value: 'Brighton, UK' },
  { key: 'focus', value: 'AI / Data / Software' },
  { key: 'main_language', value: 'Python' },
  { key: 'open_to', value: 'graduate & junior roles' },
  { key: 'currently_building', value: 'this portfolio' },
  { key: 'tabs_open', value: 'too many' },
]

function App() {
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null)
  const [openSection, setOpenSection] = useState<'projects' | 'skills' | 'experience' | 'contact' | null>(null)
  const [sectionOpenRequest, setSectionOpenRequest] = useState(0)
  const [skillsInitialMode, setSkillsInitialMode] = useState<'domain' | 'project'>('domain')

  const openMenuSection = (section: 'projects' | 'skills' | 'experience' | 'contact', skillsMode: 'domain' | 'project' = 'domain') => {
    if (section === 'skills') setSkillsInitialMode(skillsMode)
    setOpenSection(section)
    setSectionOpenRequest(request => request + 1)
  }

  useEffect(() => {
    if (!sectionOpenRequest || !openSection) return
    const section = document.getElementById(openSection)
    if (!section) return
    const destination = section.getBoundingClientRect().top + window.scrollY
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, destination)
      return
    }
    const scroll = animate(window.scrollY, destination, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: value => window.scrollTo(0, value),
    })
    const stop = () => scroll.stop()
    const onKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) stop()
    }
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      stop()
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('keydown', onKey)
    }
  }, [sectionOpenRequest, openSection])

  const handleProjectTabClick = (index: number) => {
    setActiveProjectIndex(index)

    window.requestAnimationFrame(() => {
      document.getElementById('projects-navbar')?.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      })
    })
  }

  return (
    <main className="app-shell">
    <div
      className="app-hero"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
      }}
    >
      <GradientWaves
        horizonColor="#cb10f7"
        waveColor="#363235"
        crestColor="#ff007e"
        speed={0.4}
        amplitude={3.0}
        waveScale={0.6}
        waveRatio={0.9}
        swell={40}
        turbulence={20}
        tilt={1.11}
        zoom={0.85}
        height={7.0}
        fogDepth={18}
        detail="medium"
        brightness={1}
        opacity={1}
        grain
        grainIntensity={0.00}
        mouseInteraction
        parallaxStrength={0.4}
      />

      <header className="hero-identity geo-regular">
        <p className="hero-name">
          PAVEL.JERMOLAJEV
        </p>

        <div className="hero-status" role="img" aria-label="Available for work">
          <FuzzyText
            fontSize="clamp(2.25rem, calc(4.5rem - 6vw), 3rem)"
            fontFamily='"Geo", sans-serif'
            fontWeight={400}
            color="#39ff14"
            baseIntensity={0.1}
            hoverIntensity={0.35}
            horizontalPadding={12}
            enableHover
          >
            ● Available for work
          </FuzzyText>
        </div>
      </header>

      <h1 className="hero-title">
        I build things with code, data, and ideas worth exploring.
      </h1>
    </div>

    <section className="about-section" aria-label="About">
      <div className="about-particles">
        <Particles
          particleCount={500}
          particleSpread={10}
          speed={0.1}
          particleColors={["#ff0391", "#8f2285"]}
          moveParticlesOnHover
          particleHoverFactor={1}
          alphaParticles={false}
          particleBaseSize={100}
          sizeRandomness={1}
          cameraDistance={20}
          disableRotation={false}
          className=""
        />
      </div>

      <div className="about-content">
        <div className="about-copy">
          <h2 className="about-heading">About</h2>
          <p className="about-description">
            Computer Science & AI graduate working across software, machine
            learning and data. I like taking ideas from first experiment to
            something real, useful and deployed.
          </p>

          <div className="status-panel" aria-label="Pavel current status">
            <p className="status-command">&gt; pavel.current_status</p>

            <dl className="status-list">
              {statusRows.map((row) => (
                <div className="status-row" key={row.key}>
                  <dt>{row.key}:</dt>
                  <dd>
                    {row.hint ? (
                      <span className="status-value status-value-with-hint">
                        "{row.value}"
                        <span className="status-hint" role="tooltip">
                          {row.hint}
                        </span>
                      </span>
                    ) : (
                      <span className="status-value">"{row.value}"</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="about-image-wrap">
          <img className="about-image" src={meImage} alt="Pavel Jermolajev" />
        </div>
      </div>

    </section>

    <div className="ascii-transition">
      <GradientASCII
        className="ascii-transition-art"
        aria-hidden="true"
        colors={["#78350f", "#f59e0b", "#ffffff"]}
        shape="eclipse"
        scale={600 / 1720}
        characters=" .:-=+*#%@"
        cellSize={12}
        density={0.77}
        glow={1.35}
        flicker={0.53}
        grain={0}
      />
      <ConstellationMenu onOpenProjects={() => openMenuSection('projects')} onOpenSkills={() => openMenuSection('skills')} onOpenExperience={() => openMenuSection('experience')} onOpenContact={() => openMenuSection('contact')} />
    </div>

    {openSection === 'contact' && (
      <Suspense fallback={<section id="contact" className="skills-loading" aria-busy="true">Opening Contact Me…</section>}>
        <ContactSection />
      </Suspense>
    )}

    {openSection === 'experience' && (
      <Suspense fallback={<section id="experience" className="skills-loading" aria-busy="true">Opening My Experience…</section>}>
        <ExperienceSection onOpenProjects={() => openMenuSection('skills', 'project')} onOpenSkills={() => openMenuSection('skills')} />
      </Suspense>
    )}

    {openSection === 'skills' && (
      <Suspense fallback={<section id="skills" className="skills-loading" aria-busy="true">Opening the atlas…</section>}>
        <SkillAtlas key={skillsInitialMode} initialMode={skillsInitialMode} />
      </Suspense>
    )}

    {openSection === 'projects' && <section className="projects-section" id="projects" aria-label="Projects">
      <div className="projects-atmosphere" aria-hidden="true" />
      <div className="projects-content">
        <GradientText
          colors={["#e207ff", "#f727a0", "#755199"]}
          animationSpeed={2.5}
          showBorder
          className="projects-gradient-title"
        >
          <span>Selected Work</span>
        </GradientText>

        <p className="projects-subtitle">
          Projects that best represent how I build, experiment and solve problems.
        </p>

        <p className="projects-lab-intro">
          <strong>This is a project laboratory,</strong> to interact, experiment,
          and find out more about each of the following projects.
        </p>

        <p className="projects-choice-prompt" id="project-choice-prompt">
          Please choose a project
        </p>

        <div className="projects-switcher">
          <nav className="project-tabs" id="projects-navbar" aria-label="Project selector" aria-describedby="project-choice-prompt">
            {projectItems.map((item, index) => (
              <button
                className={`project-tab ${activeProjectIndex === index ? 'is-active' : ''}`}
                type="button"
                key={item}
                aria-pressed={activeProjectIndex === index}
                onClick={() => handleProjectTabClick(index)}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        {activeProjectIndex !== null && <div className="project-display" key={activeProjectIndex}>
          {activeProjectIndex === 0 ? (
            <HarCaseStudy />
          ) : activeProjectIndex === 1 ? (
            <DigisoftCaseStudy />
          ) : (
            <div className="project-placeholder">
              <p>{projectItems[activeProjectIndex]}</p>
              <span>Data Engineering project case study is coming soon</span>
            </div>
          )}
        </div>}
      </div>
    </section>}
    </main>
  )
}

export default App
