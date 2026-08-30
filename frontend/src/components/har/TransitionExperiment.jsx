import { useReducedMotion } from 'motion/react'
import { useRef, useState } from 'react'
import { harProjectData } from './harProjectData'

const tracks = [
  { label: 'LEFT ARM', driftBoundary: 43, driftState: 'ACTIVITY B' },
  { label: 'BACK', driftBoundary: 50, driftState: 'ACTIVITY A' },
  { label: 'LEG', driftBoundary: 58, driftState: 'ACTIVITY A' },
]

const windowWidth = 28

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getWindowInfo(windowStart, isDrifted) {
  const windowEnd = windowStart + windowWidth
  const boundaries = isDrifted ? tracks.map((track) => track.driftBoundary) : [50]
  const crossesBoundary = boundaries.some((boundary) => windowStart < boundary && windowEnd > boundary)
  const label = crossesBoundary ? 'mixed window' : 'single activity'
  const split = clamp(((50 - windowStart) / windowWidth) * 100, 0, 100)

  return { crossesBoundary, label, split }
}

export default function TransitionExperiment() {
  const prefersReducedMotion = useReducedMotion()
  const visualRef = useRef(null)
  const [isDrifted, setIsDrifted] = useState(false)
  const [windowStart, setWindowStart] = useState(36)

  const windowInfo = getWindowInfo(windowStart, isDrifted)

  const updateWindowFromClientX = (clientX) => {
    const visual = visualRef.current
    if (!visual) return

    const rect = visual.getBoundingClientRect()
    const position = ((clientX - rect.left) / rect.width) * 100 - windowWidth / 2
    setWindowStart(clamp(position, 0, 100 - windowWidth))
  }

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateWindowFromClientX(event.clientX)
  }

  const handlePointerMove = (event) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    updateWindowFromClientX(event.clientX)
  }

  const moveToSteady = () => setWindowStart(8)
  const moveToTransition = () => setWindowStart(36)

  const toggleDrift = () => {
    setIsDrifted((current) => !current)

    if (prefersReducedMotion) {
      setWindowStart(36)
    }
  }

  return (
    <div className={`transition-experiment ${isDrifted ? 'is-drifted' : ''}`}>
      <div className="transition-copy">
        <p className="har-section-label">EXP 04 / TRANSITIONS</p>
        <h2>
          Standing is easy. Sitting is easy.
          <span>Somewhere between the two gets messy.</span>
        </h2>
        <p>ML models don't see an activity as a neat label.</p>
        <p>They see short windows of sensor readings. Around a transition, one window can contain pieces of two different movements.</p>
      </div>

      <div className="transition-lab-panel">
        <div className="transition-visual-header">
          <div>
            <span>MODEL WINDOW</span>
            <strong>1.28 s</strong>
          </div>
          <p>{windowInfo.label}</p>
        </div>

        <div
          className="transition-track-visual"
          ref={visualRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          {tracks.map((track) => (
            <div className="activity-track-row" style={{ '--boundary': `${isDrifted ? track.driftBoundary : 50}%` }} key={track.label}>
              <span>{track.label}</span>
              <div className="activity-track">
                <i className="activity-a">ACTIVITY A</i>
                <i className="activity-b">ACTIVITY B</i>
                <b />
                <span
                  className={`activity-window-highlight ${windowInfo.crossesBoundary ? 'is-mixed' : ''}`}
                  style={{
                    left: `${windowStart}%`,
                    width: `${windowWidth}%`,
                    '--split': `${clamp((((isDrifted ? track.driftBoundary : 50) - windowStart) / windowWidth) * 100, 0, 100)}%`,
                  }}
                >
                  {track.label === 'BACK' ? (
                    <>
                      <strong>MODEL WINDOW</strong>
                      <small>1.28 s</small>
                    </>
                  ) : null}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="transition-controls">
          <button type="button" onClick={moveToSteady}>
            steady activity
          </button>
          <button type="button" onClick={moveToTransition}>
            transition
          </button>
          <button type="button" onClick={toggleDrift}>
            {isDrifted ? 'REALIGN SENSORS' : 'INTRODUCE DRIFT →'}
          </button>
        </div>

        {isDrifted && windowInfo.crossesBoundary ? (
          <div className="transition-state-readout">
            <div className="transition-state-list">
              {tracks.map((track) => (
                <p key={track.label}>
                  <span>{track.label}</span>
                  <strong>{track.driftState}</strong>
                </p>
              ))}
            </div>
            <h3>
              Same model window.
              <span>Different moments.</span>
            </h3>
          </div>
        ) : null}
      </div>

      <div className="transition-results-grid">
        <div className="transition-result-card">
          <span>NO TRANSITION</span>
          <p>
            Aligned <strong>{Math.round(harProjectData.transitions.nonTransitionAligned * 100)}%</strong>
          </p>
          <p>
            Misaligned <strong>{Math.round(harProjectData.transitions.nonTransitionMisaligned * 100)}%</strong>
          </p>
        </div>

        <div className="transition-result-card is-difficult">
          <span>DIFFICULT TRANSITION</span>
          <em>Back-transition test scenario</em>
          <p>
            Aligned <strong>{Math.round(harProjectData.transitions.backTransitionAligned * 100)}%</strong>
          </p>
          <p>
            Misaligned <strong>{Math.round(harProjectData.transitions.backTransitionMisaligned * 100)}%</strong>
          </p>
        </div>
      </div>

      <div className="transition-conclusion">
        <div>
          <p>Did misalignment make transitions uniquely worse?</p>
          <strong>Not really.</strong>
        </div>
        <p>
          Transitions were difficult, and misalignment was difficult, but the proportional drop caused by transitions followed a similar pattern in
          aligned and misaligned data.
        </p>
        <p>The results suggested that both effects mostly contributed independently rather than strongly amplifying one another.</p>
        <h3>This result is important.</h3>
      </div>

      <div className="expected-observed-strip" aria-label="Expected versus observed transition result">
        <p>
          <span>EXPECTED</span>
          transition + drift = dramatically amplified failure
        </p>
        <p>
          <span>OBSERVED</span>
          transition penalty + misalignment penalty
        </p>
      </div>
    </div>
  )
}
