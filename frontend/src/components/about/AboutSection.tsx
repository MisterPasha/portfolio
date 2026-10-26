import { useState } from 'react'
import { useReducedMotion } from 'motion/react'
import Particles from '@/components/Particles'
import meImage from '@/assets/me.PNG?url'
import './AboutSection.css'

const statusRows = [
  { key: 'name', value: 'Pavel Jermolajev', hint: 'People refer to me as Pav' },
  { key: 'location', value: 'Brighton, UK' },
  { key: 'focus', value: 'AI / Data / Software' },
  { key: 'main_language', value: 'Python' },
  { key: 'open_to', value: 'graduate & junior roles' },
  { key: 'currently_building', value: 'Data Engineering project' },
  { key: 'tabs_open', value: 'too many' },
]

export default function AboutSection() {
  const reducedMotion = useReducedMotion()
  const [showNameHint, setShowNameHint] = useState(false)

  return (
    <section className="about-section" aria-labelledby="about-heading">
      <div className="about-particles" aria-hidden="true">
        <Particles
          particleCount={500}
          particleSpread={10}
          speed={reducedMotion ? 0 : 0.06}
          particleColors={['#fef3c7', '#f59e0b', '#bca78b']}
          moveParticlesOnHover={!reducedMotion}
          interactionTarget=".about-section"
          particleHoverFactor={0.65}
          alphaParticles={false}
          particleBaseSize={85}
          sizeRandomness={1}
          cameraDistance={20}
          disableRotation={!!reducedMotion}
          className="about-starfield"
        />
      </div>

      <div className="about-content">
        <header className="about-intro">
          <h2 className="about-heading" id="about-heading">About</h2>
          <p className="about-description">
            Computer Science & AI graduate working across software, machine
            learning and data. I like taking ideas from first experiment to
            something real, useful and deployed.
          </p>
        </header>

        <div className="about-image-wrap">
          <div className="about-portrait-orbit" aria-hidden="true" />
          <div className="about-portrait">
            <img
              className="about-image"
              src={meImage}
              alt="Pavel Jermolajev"
              loading="lazy"
              decoding="async"
              width={720}
              height={1082}
            />
          </div>
        </div>

        <div className="status-panel" aria-label="Pavel current status">
          <p className="status-command">&gt; pavel.current_status</p>
          <dl className="status-list">
            {statusRows.map((row) => (
              <div className="status-row" data-status={row.key} key={row.key}>
                <dt>{row.key}:</dt>
                <dd>
                  {row.hint ? (
                    <span
                      className="status-value status-value-with-hint"
                      tabIndex={0}
                      aria-describedby="about-name-hint"
                      data-hint-open={showNameHint}
                      onMouseEnter={() => setShowNameHint(true)}
                      onMouseLeave={event => {
                        if (document.activeElement !== event.currentTarget) setShowNameHint(false)
                      }}
                      onFocus={() => setShowNameHint(true)}
                      onBlur={() => setShowNameHint(false)}
                      onKeyDown={event => {
                        if (event.key === 'Escape') setShowNameHint(false)
                      }}
                    >
                      "{row.value}"
                      <span className="status-hint" id="about-name-hint" role="tooltip">
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
    </section>
  )
}
