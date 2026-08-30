import { useEffect, useRef, useState } from 'react'

const heroSensors = [
  { label: 'LEFT CALF', x: 39, y: 88 },
  { label: 'LEFT THIGH', x: 43, y: 72 },
  { label: 'RIGHT CALF', x: 61, y: 88 },
  { label: 'RIGHT THIGH', x: 57, y: 72 },
  { label: 'CENTRE TORSO', x: 50, y: 39, drift: true },
  { label: 'LEFT LOWER ARM', x: 21, y: 53 },
  { label: 'LEFT UPPER ARM', x: 29, y: 37 },
  { label: 'RIGHT LOWER ARM', x: 79, y: 53, drift: true },
  { label: 'RIGHT UPPER ARM', x: 71, y: 37 },
]

export default function HarHero() {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDesynced, setIsDesynced] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.35 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return undefined

    const timeout = window.setTimeout(() => {
      setIsDesynced(true)
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [isVisible])

  const scrollToNextSection = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    document.getElementById('har-problem')?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <section
      className={`har-hero ${isVisible ? 'is-visible' : ''} ${isDesynced ? 'is-desynced' : ''}`}
      ref={sectionRef}
      aria-labelledby="har-hero-title"
    >
      <div className="har-hero-copy">
        <p className="har-hero-eyebrow">01 / HUMAN ACTIVITY RECOGNITION</p>
        <p className="har-hero-label">FINAL-YEAR RESEARCH</p>
        <h2 id="har-hero-title">
          What happens when wearable sensors
          <span>stop agreeing with each other?</span>
        </h2>
        <p className="har-hero-summary">
          I investigated what happens to a Human Activity Recognition model when the wearable sensors feeding it slowly drift out of sync.
        </p>

        <div className="har-hero-facts" aria-label="Project facts">
          <span>9 IMUs</span>
          <span>33 ACTIVITIES</span>
          <span>50 Hz</span>
          <span>ConvLSTM</span>
        </div>

        <button className="har-hero-cta" type="button" onClick={scrollToNextSection}>
          Explore the experiment ↓
        </button>
      </div>

      <div className="har-hero-visual" aria-hidden="true">
        <svg className="har-human-outline" viewBox="0 0 420 560" role="img">
          <circle className="har-human-line" cx="210" cy="112" r="58" />

          <rect className="har-limb" x="142" y="174" width="136" height="238" rx="64" />
          <rect className="har-limb faint" x="77" y="194" width="52" height="222" rx="26" transform="rotate(13 103 305)" />
          <rect className="har-limb faint" x="291" y="194" width="52" height="222" rx="26" transform="rotate(-13 317 305)" />
          <rect className="har-limb faint" x="135" y="393" width="58" height="178" rx="29" transform="rotate(11 164 482)" />
          <rect className="har-limb faint" x="227" y="393" width="58" height="178" rx="29" transform="rotate(-11 256 482)" />

          <path className="har-human-signal" d="M72 418 C138 374 184 428 243 382 S341 363 378 414" />
        </svg>

        {heroSensors.map((sensor, index) => (
          <span
            className={`har-hero-sensor ${sensor.drift ? 'will-drift' : ''}`}
            style={{
              left: `${sensor.x}%`,
              top: `${sensor.y}%`,
              '--sensor-index': index,
            }}
            key={sensor.label}
          >
            <i />
            <em>{sensor.label}</em>
          </span>
        ))}
      </div>
    </section>
  )
}
