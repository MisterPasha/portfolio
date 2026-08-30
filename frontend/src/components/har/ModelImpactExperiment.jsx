import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import HumanSensorDiagram from './HumanSensorDiagram'
import { harProjectData } from './harProjectData'

const sensorCountStates = [0, 3, 6, 9]
const deterministicMisalignmentOrder = [
  'back',
  'right-lower-arm',
  'left-thigh',
  'left-lower-arm',
  'right-thigh',
  'right-upper-arm',
  'left-calf',
  'right-calf',
  'left-upper-arm',
]

const laterViews = [
  { id: 'full', label: 'FULL RECORDING', accuracy: 78 },
  { id: 'secondHalf', label: 'SECOND HALF', accuracy: 74 },
  { id: 'lastQuarter', label: 'LAST QUARTER', accuracy: 72 },
]

function toPercent(value) {
  return Math.round(value * 100)
}

function getAccuracy(count) {
  return toPercent(harProjectData.modelImpact.misalignedSensorAccuracy[count])
}

export default function ModelImpactExperiment() {
  const prefersReducedMotion = useReducedMotion()
  const animationFrame = useRef(null)
  const [sensorCount, setSensorCount] = useState(0)
  const [displayAccuracy, setDisplayAccuracy] = useState(getAccuracy(0))
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [laterView, setLaterView] = useState('full')
  const [hasRevealedLaterDrift, setHasRevealedLaterDrift] = useState(false)

  const accuracy = getAccuracy(sensorCount)
  const driftStrength = sensorCount / 9
  const misalignedSensorIds = deterministicMisalignmentOrder.slice(0, sensorCount)
  const selectedLaterView = laterViews.find((view) => view.id === laterView)

  useEffect(
    () => () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    },
    [],
  )

  const animateAccuracy = (nextAccuracy) => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
    }

    if (prefersReducedMotion) {
      setDisplayAccuracy(nextAccuracy)
      return
    }

    const start = displayAccuracy
    const difference = nextAccuracy - start
    const startedAt = performance.now()
    const duration = 320

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayAccuracy(Math.round(start + difference * eased))

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(tick)
      }
    }

    animationFrame.current = requestAnimationFrame(tick)
  }

  const updateSensorCount = (index) => {
    const nextSensorCount = sensorCountStates[index]

    setSensorCount(nextSensorCount)
    if (nextSensorCount === 6) {
      setHasRevealedLaterDrift(true)
    }
    animateAccuracy(getAccuracy(nextSensorCount))
  }

  return (
    <div className="model-impact-experiment" style={{ '--drift-strength': driftStrength }}>
      <div className="model-impact-copy">
        <p className="har-section-label">EXP 02 / MODEL IMPACT</p>
        <h2>Okay, but does a few milliseconds actually matter?</h2>
        <p>I trained the model using synchronised data and then introduced realistic clock drift into its sensor streams.</p>
        <p>
          The sensor readings were still valid.
          <span>Their timing wasn't.</span>
        </p>

        <button className="drift-detail-toggle" type="button" aria-expanded={isDetailOpen} onClick={() => setIsDetailOpen(!isDetailOpen)}>
          HOW WAS THE DRIFT SIMULATED? {isDetailOpen ? '-' : '+'}
        </button>

        <div className={`drift-detail-copy ${isDetailOpen ? 'is-open' : ''}`}>
          <p>
            Instead of shifting an entire signal by an arbitrary amount, I slightly changed individual sensors' effective sampling rates.
          </p>
          <p>
            Interpolation simulated a sensor running slightly faster, while dropped rows simulated one running slightly slower. The streams
            therefore moved apart gradually over time.
          </p>
        </div>
      </div>

      <div className="model-impact-main">
        <div className="model-diagram-panel">
          <HumanSensorDiagram misalignedSensorIds={misalignedSensorIds} />
        </div>

        <div className="model-control-panel">
          <div className="accuracy-metric">
            <span>MODEL ACCURACY</span>
            <strong>{displayAccuracy}%</strong>
          </div>

          <div className="misaligned-control">
            <label htmlFor="misaligned-sensor-count">MISALIGNED SENSORS</label>
            <input
              id="misaligned-sensor-count"
              type="range"
              min="0"
              max="3"
              step="1"
              value={sensorCountStates.indexOf(sensorCount)}
              onChange={(event) => updateSensorCount(Number(event.target.value))}
            />
            <div className="sensor-count-options" aria-hidden="true">
              {sensorCountStates.map((count, index) => (
                <button className={count === sensorCount ? 'is-active' : ''} type="button" onClick={() => updateSensorCount(index)} key={count}>
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="accuracy-trace">
            <div className="baseline-row">
              <span>ALIGNED BASELINE</span>
              <i />
              <strong>84%</strong>
            </div>
            <div className="current-accuracy-marker" style={{ '--accuracy-position': `${((84 - accuracy) / 8) * 100}%` }}>
              <span>CURRENT</span>
              <strong>{accuracy}%</strong>
            </div>
          </div>

          <p className="wave-graph-hint">See changes in the wave graph below</p>
        </div>
      </div>

      <section className="signal-alignment-section" aria-labelledby="signal-alignment-title">
        <div className="signal-copy">
          <p className="har-section-label">WHY DOES IT MATTER?</p>
          <h3 id="signal-alignment-title">The model doesn't understand clocks.</h3>
          <p>It receives a window of numbers and assumes those numbers belong together.</p>
          <p>
            Once one sensor is ahead of another, the model can combine the position of your arm now with the position of your leg a fraction of a
            second ago.
          </p>
          <strong>
            Individually the readings are valid.
            <span>Together they can describe a movement that never actually happened.</span>
          </strong>
        </div>

        <div className="signal-track-panel">
          <div className="alignment-state-label">
            <span>ALIGNMENT</span>
            <strong>{sensorCount === 0 ? 'ALIGNED' : 'DRIFTED'}</strong>
          </div>

          {['LEFT ARM', 'RIGHT ARM', 'BACK'].map((label, index) => (
            <div className="signal-row" style={{ '--signal-index': index }} key={label}>
              <span>{label}</span>
              <div className="signal-wave-wrap">
                <svg className="signal-wave" viewBox="0 0 360 64" preserveAspectRatio="none">
                  <path d="M0 42 C34 40 48 17 78 18 C111 19 116 48 149 47 C183 46 190 20 222 19 C254 18 269 45 304 45 C328 45 342 35 360 32" />
                </svg>
                <i className="model-window-overlay">
                  <b>same row</b>
                  <b>different moments</b>
                </i>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`later-drift-card ${hasRevealedLaterDrift ? 'is-visible' : ''}`} aria-hidden={!hasRevealedLaterDrift}>
        <div>
          <p className="har-section-label">AND THEN I LET IT DRIFT...</p>
          <div className="later-view-options">
            {laterViews.map((view) => (
              <button className={laterView === view.id ? 'is-active' : ''} type="button" onClick={() => setLaterView(view.id)} key={view.id}>
                <span>{view.label}</span>
                <strong>{view.accuracy}%</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="later-drift-copy">
          {laterView === 'lastQuarter' ? (
            <div className="relative-drop">
              <strong>▼ {harProjectData.modelImpact.relativeLastQuarterDrop}%</strong>
              <span>relative to the 84% aligned baseline</span>
            </div>
          ) : (
            <div className="relative-drop">
              <strong>{selectedLaterView.accuracy}%</strong>
              <span>{selectedLaterView.label.toLowerCase()} under six-sensor misalignment</span>
            </div>
          )}

          <p>
            At first, the timing difference was small enough that the model mostly coped. But drift accumulated. In the later part of the experiment,
            six drifting sensors reduced accuracy to about 72%.
          </p>
        </div>
      </section>
    </div>
  )
}
