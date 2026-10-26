import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { animate } from 'motion'
import './App.css'
import FuzzyText from '@/components/FuzzyText'
import GradientText from '@/components/GradientText'
import GradientWaves from '@/components/GradientWaves'
import GradientASCII from '@/components/GradientASCII'
import ConstellationMenu from '@/components/ConstellationMenu'
import AboutSection from '@/components/about/AboutSection'
import HarCaseStudy from '@/components/har/HarCaseStudy'
import DigisoftCaseStudy from '@/components/digisoft/DigisoftCaseStudy'
import PavelBotLoading from '@/components/chat/PavelBotLoading'

const SkillAtlas = lazy(() => import('@/components/skills/SkillAtlas'))
const ExperienceSection = lazy(() => import('@/components/experience/ExperienceSection'))
const ContactSection = lazy(() => import('@/components/contact/ContactSection'))
const PavelBot = lazy(() => import('@/components/chat/PavelBot'))

type PortfolioSection = 'projects' | 'skills' | 'experience' | 'contact' | 'chat'

const projectItems = [
  'ACTIVITY RECOGNITION',
  'DIGISOFT',
  'DATA PIPELINE',
]

function Portfolio() {
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null)
  const [openSection, setOpenSection] = useState<PortfolioSection | null>(null)
  const [scrollTarget, setScrollTarget] = useState<PortfolioSection | 'portfolio-menu' | null>(null)
  const [sectionOpenRequest, setSectionOpenRequest] = useState(0)
  const [skillsInitialMode, setSkillsInitialMode] = useState<'domain' | 'project'>('domain')

  const openMenuSection = (section: PortfolioSection, skillsMode: 'domain' | 'project' = 'domain') => {
    if (section === 'skills') setSkillsInitialMode(skillsMode)
    setOpenSection(section)
    setScrollTarget(section)
    setSectionOpenRequest(request => request + 1)
  }

  const backToMenu = useCallback(() => {
    setScrollTarget('portfolio-menu')
    setSectionOpenRequest(request => request + 1)
  }, [])

  useEffect(() => {
    if (!sectionOpenRequest || !scrollTarget) return
    const section = document.getElementById(scrollTarget)
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
  }, [sectionOpenRequest, scrollTarget])

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
        horizonColor="#7c2d12"
        waveColor="#fb923c"
        crestColor="#fef3c7"
        speed={0.4}
        amplitude={3.85}
        relief={1}
        lightAngle={-59}
        mouseInteraction
        swellOnClick
        waveScale={0.7}
        waveRatio={0.49}
        swell={36}
        turbulence={10.5}
        tilt={60}
        zoom={0.75}
        height={7.1}
        fogDepth={23}
        sheen={0.21}
        grain={0.1}
        mouseStrength={0.57}
        intro={false}
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

    <AboutSection />

    <div className="ascii-transition" id="portfolio-menu">
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
      <ConstellationMenu onOpenProjects={() => openMenuSection('projects')} onOpenSkills={() => openMenuSection('skills')} onOpenExperience={() => openMenuSection('experience')} onOpenContact={() => openMenuSection('contact')} onOpenChat={() => openMenuSection('chat')} />
    </div>

    {openSection === 'chat' && (
      <section id="chat" className="chat-section" aria-label="PAVEL.BOT">
        <Suspense fallback={<PavelBotLoading />}>
          <PavelBot onBackToMenu={backToMenu} />
        </Suspense>
      </section>
    )}

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

export default function App() {
  if (window.location.pathname.replace(/\/$/, '') === '/pavel-bot') {
    return <Suspense fallback={<PavelBotLoading />}><PavelBot /></Suspense>
  }
  return <Portfolio />
}
