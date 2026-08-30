import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import HumanSensorDiagram from './HumanSensorDiagram'
import { harProjectData } from './harProjectData'

const allSensorIds = [
  'left-calf',
  'left-thigh',
  'right-calf',
  'right-thigh',
  'back',
  'left-lower-arm',
  'left-upper-arm',
  'right-lower-arm',
  'right-upper-arm',
]

const reducedConfigs = {
  9: {
    label: '9 SENSORS',
    shortLabel: '9 sensors',
    visibleSensorIds: allSensorIds,
    data: harProjectData.reducedSensors.full,
  },
  6: {
    label: '6 SENSORS',
    shortLabel: '6 sensors',
    detail: 'representative DS2',
    visibleSensorIds: ['left-calf', 'left-thigh', 'right-thigh', 'back', 'left-upper-arm', 'right-upper-arm'],
    data: harProjectData.reducedSensors.sixRepresentative,
  },
  3: {
    label: '3 SENSORS',
    shortLabel: '3 sensors',
    detail: 'representative DS3',
    visibleSensorIds: ['right-upper-arm', 'left-upper-arm', 'left-thigh'],
    data: harProjectData.reducedSensors.threeRepresentative,
  },
}

const sensorOptions = [9, 6, 3]

function toPercent(value) {
  return Math.round(value * 100)
}

export default function ReducedSensorsExperiment() {
  const prefersReducedMotion = useReducedMotion()
  const animationFrame = useRef(null)
  const [sensorCount, setSensorCount] = useState(9)
  const [isMisaligned, setIsMisaligned] = useState(false)
  const [displayAccuracy, setDisplayAccuracy] = useState(toPercent(reducedConfigs[9].data.aligned))
  const [isNoteOpen, setIsNoteOpen] = useState(false)

  const currentConfig = reducedConfigs[sensorCount]
  const misalignedSensorIds = isMisaligned ? currentConfig.visibleSensorIds : []

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
    let startedAt = null
    const duration = 320

    const tick = (now) => {
      if (startedAt === null) {
        startedAt = now
      }

      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayAccuracy(Math.round(start + difference * eased))

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(tick)
      }
    }

    animationFrame.current = requestAnimationFrame(tick)
  }

  const updateConfiguration = (nextSensorCount) => {
    const nextConfig = reducedConfigs[nextSensorCount]
    setSensorCount(nextSensorCount)
    animateAccuracy(toPercent(isMisaligned ? nextConfig.data.misaligned : nextConfig.data.aligned))
  }

  const updateAlignment = (nextIsMisaligned) => {
    setIsMisaligned(nextIsMisaligned)
    animateAccuracy(toPercent(nextIsMisaligned ? currentConfig.data.misaligned : currentConfig.data.aligned))
  }

  return (
    <div className="reduced-sensors-experiment">
      <div className="reduced-sensors-copy">
        <p className="har-section-label">EXP 03 / FEWER SENSORS</p>
        <h2>
          Nine sensors work well.
          <span>Nine sensors are also annoying to wear.</span>
        </h2>
        <p>
          This research was motivated by technology-supported rehabilitation for people living with chronic pain, where a practical system would
          ideally rely on fewer wearable devices.
        </p>
        <p>So I trained new models with smaller sensor sets and repeated the misalignment test.</p>
      </div>

      <div className="reduced-sensors-main">
        <div className="reduced-diagram-panel">
          <div className="sensor-config-picker" aria-label="How many sensors">
            <span>HOW MANY SENSORS?</span>
            <div>
              {sensorOptions.map((option) => (
                <button className={sensorCount === option ? 'is-active' : ''} type="button" onClick={() => updateConfiguration(option)} key={option}>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <HumanSensorDiagram
            className="reduced-human-diagram"
            visibleSensorIds={currentConfig.visibleSensorIds}
            misalignedSensorIds={misalignedSensorIds}
          />

          <p className="representative-caption">Representative tested configurations</p>
        </div>

        <div className="reduced-results-panel">
          <div className="alignment-toggle" role="group" aria-label="Alignment state">
            <span>ALIGNED</span>
            <button
              className={isMisaligned ? 'is-misaligned' : ''}
              type="button"
              aria-pressed={isMisaligned}
              onClick={() => updateAlignment(!isMisaligned)}
            >
              <i />
            </button>
            <span>MISALIGNED</span>
          </div>

          <div className="current-model-card">
            <span>CURRENT MODEL</span>
            <h3>{currentConfig.label}</h3>
            <strong>{displayAccuracy}%</strong>
            <p>{isMisaligned ? 'misaligned' : 'aligned'}</p>
            {isMisaligned ? <b>▼ {currentConfig.data.dropPercent.toFixed(1)}%</b> : null}
          </div>

          <div className="drop-comparison-strip" aria-label="Accuracy drop comparison">
            {sensorOptions.map((option) => {
              const config = reducedConfigs[option]
              const strongest = option === 3 && sensorCount === 3

              return (
                <button
                  className={`${sensorCount === option ? 'is-active' : ''} ${strongest ? 'is-strongest' : ''}`}
                  type="button"
                  onClick={() => updateConfiguration(option)}
                  key={option}
                >
                  <span>{config.shortLabel}</span>
                  <i>
                    <b style={{ width: `${(config.data.dropPercent / 30.7) * 100}%` }} />
                  </i>
                  <strong>{config.data.dropPercent.toFixed(1)}%</strong>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="reduced-explanation-grid">
        <div className="reduced-explanation-copy">
          <p>With nine sensors, the model has more redundant information.</p>
          <p>
            With only three, each stream matters much more. If one loses alignment, there are fewer alternative signals for the model to rely on.
          </p>
          <strong>Convenience came with a robustness cost.</strong>
        </div>

        <div className="sensor-position-note">
          <button type="button" aria-expanded={isNoteOpen} onClick={() => setIsNoteOpen(!isNoteOpen)}>
            DOES SENSOR POSITION MATTER? {isNoteOpen ? '-' : '+'}
          </button>
          <div className={`sensor-position-copy ${isNoteOpen ? 'is-open' : ''}`}>
            <p>Yes. I also tested different body-location combinations, and they did not perform equally.</p>
            <p>
              My assumption that sensors on limbs with a larger natural range of movement would automatically provide the most useful features was not
              consistently supported by the results.
            </p>
            <p>This is useful because it shows that sensor placement matters, but not always for the obvious reason.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
