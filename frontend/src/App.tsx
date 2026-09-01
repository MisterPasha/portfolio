import { useRef, useState } from 'react'
import './App.css'
import FuzzyText from '@/components/FuzzyText'
import GradientText from '@/components/GradientText'
import GradientWaves from '@/components/GradientWaves'
import Particles from '@/components/Particles'
import HarCaseStudy from '@/components/har/HarCaseStudy'
import meImage from '@/assets/me.png'

const navItems = ['ABOUT', 'PROJECTS', 'EXPERIENCE', 'LAB', 'CHAT', 'CONTACT']
const projectItems = [
  'ACTIVITY RECOGNITION',
  'CHATBOT',
  'THIS PORTFOLIO',
  'KUMO MOCHI',
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
  const [activeProjectIndex, setActiveProjectIndex] = useState(0)
  const projectDisplayRef = useRef<HTMLDivElement>(null)

  const handleProjectTabClick = (index: number) => {
    setActiveProjectIndex(index)

    window.requestAnimationFrame(() => {
      projectDisplayRef.current?.scrollIntoView({
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

      <header className="hero-navbar geo-regular" aria-label="Primary navigation">
        <button className="hero-logo" type="button">
          PAVEL.JERMOLAJEV
        </button>

        <nav className="hero-nav-links">
          {navItems.map((item) => (
            <button className="hero-nav-button" type="button" key={item}>
              [ {item} ]
            </button>
          ))}
        </nav>
      </header>

      <div className="hero-status geo-regular">
        <FuzzyText
          fontSize="clamp(0.4rem, 2.0vw, 2.0rem)"
          fontFamily = '"Geo", sans-serif'
          fontWeight = {400}
          color="#39ff14"
          baseIntensity={0.1}
          hoverIntensity={0.35}
          enableHover
        >
          ● Available for work
        </FuzzyText>
      </div>

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
          <p className="about-kicker">pavel.current_status</p>
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

      <div className="about-actions geo-regular">
        <button className="about-action-button" type="button">
          [ EXPLORE MY WORK ]
        </button>
        <button className="about-action-button" type="button">
          [ ASK MY AI ↗ ]
        </button>
      </div>
    </section>

    <section className="projects-section" id="projects" aria-label="Projects">
      <div className="projects-atmosphere" aria-hidden="true" />
      <div className="projects-content">
        <GradientText
          colors={["#e207ff", "#f727a0", "#755199"]}
          animationSpeed={2.5}
          showBorder
          className="projects-gradient-title"
        >
          <span>Project Lab</span>
          <span>Selected Work</span>
        </GradientText>

        <p className="projects-subtitle">
          Four projects that best represent how I build, experiment and solve problems.
        </p>

        <div className="projects-switcher">
          <nav className="project-tabs" id="projects-navbar" aria-label="Project selector">
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

        <div className="project-display" ref={projectDisplayRef}>
          {activeProjectIndex === 0 ? (
            <HarCaseStudy />
          ) : (
            <div className="project-placeholder">
              <p>{projectItems[activeProjectIndex]}</p>
              <span>Case study coming next.</span>
            </div>
          )}
        </div>
      </div>
    </section>
    </main>
  )
}

export default App
