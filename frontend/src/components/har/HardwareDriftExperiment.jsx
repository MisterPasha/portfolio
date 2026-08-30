import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { harProjectData } from './harProjectData'

const sensors = harProjectData.hardware.offsetsAfterOneHour.map((offset, index) => ({
  id: `S${String(index + 1).padStart(2, '0')}`,
  offset,
  jitters: harProjectData.hardware.jitterCounts[index],
}))

const maxOffset = Math.max(...sensors.map((sensor) => sensor.offset))
const maxJitters = Math.max(...sensors.map((sensor) => sensor.jitters))
const runDurationMs = 4600

function formatTime(progress) {
  const totalSeconds = Math.round(progress * 60 * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function HardwareDriftExperiment() {
  const prefersReducedMotion = useReducedMotion()
  const animationFrame = useRef(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')

  const isRunning = status === 'running'
  const isComplete = status === 'complete'

  useEffect(
    () => () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    },
    [],
  )

  const stopAnimation = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
      animationFrame.current = null
    }
  }

  const runTest = () => {
    if (isRunning) return

    stopAnimation()

    if (prefersReducedMotion) {
      setProgress(1)
      setStatus('complete')
      return
    }

    setProgress(0)
    setStatus('running')
    const startedAt = performance.now()

    const tick = (now) => {
      const nextProgress = Math.min((now - startedAt) / runDurationMs, 1)
      setProgress(nextProgress)

      if (nextProgress < 1) {
        animationFrame.current = requestAnimationFrame(tick)
      } else {
        animationFrame.current = null
        setStatus('complete')
      }
    }

    animationFrame.current = requestAnimationFrame(tick)
  }

  const resetExperiment = () => {
    stopAnimation()
    setStatus('idle')
    setProgress(0)
  }

  return (
    <div className={`hardware-drift-experiment ${isRunning ? 'is-running' : ''} ${isComplete ? 'is-complete' : ''}`}>
      <div className="hardware-drift-copy">
        <p className="har-section-label">EXP 01 / HARDWARE DRIFT</p>
        <h2 id="har-experiment-lab-title">Do identical sensors actually stay synchronised?</h2>
        <p>I ran six sensor prototypes at 40 Hz for an hour and compared the timestamps they produced.</p>
        <p>Every sensor should produce one reading roughly every 25 ms.</p>
      </div>

      <div className="hardware-drift-grid">
        <div className="drift-simulation-panel">
          <div className="drift-simulation-header">
            <div>
              <span>TIME</span>
              <strong>{formatTime(progress)}</strong>
            </div>

            <button className="har-run-button" type="button" disabled={isRunning} onClick={runTest}>
              {isRunning ? 'RUNNING 60 MIN TEST' : 'RUN 60 MIN TEST →'}
            </button>
          </div>

          <div className="drift-sensor-rows" aria-label="Time-compressed visualisation of measured sensor drift after one hour">
            {sensors.map((sensor, index) => {
              const currentOffset = Math.round(sensor.offset * progress)
              const endpointProgress = maxOffset === 0 ? 0 : (sensor.offset / maxOffset) * progress

              return (
                <div
                  className={`drift-sensor-row ${isComplete && index === 1 ? 'is-outlier' : ''}`}
                  style={{ '--endpoint-progress': endpointProgress }}
                  key={sensor.id}
                >
                  <span>{sensor.id}</span>
                  <div className="drift-sensor-track">
                    <i />
                  </div>
                  <strong>{currentOffset === 0 ? '0 ms' : `+${currentOffset} ms`}</strong>
                  {isComplete && index === 1 ? <em>largest offset</em> : null}
                </div>
              )
            })}
          </div>

          <p className="drift-visual-note">Time-compressed visualisation of the measured end state.</p>
        </div>

        <aside className={`drift-result-card ${isComplete ? 'is-visible' : ''}`} aria-live="polite">
          <div>
            <strong>133 ms</strong>
            <span>largest measured offset after one hour</span>
          </div>
          <p>Sensor 02 also produced 89 timing jitters, while Sensor 05 produced only one.</p>
          <h3>Identical hardware didn't necessarily behave identically.</h3>
          <small>40 Hz = one frame every 25 ms</small>
          <small>Therefore 133 ms represents several sampling frames of separation.</small>
        </aside>
      </div>

      <div className={`jitter-chart-panel ${isComplete ? 'is-visible' : ''}`}>
        <div className="jitter-chart-heading">
          <span>TIMING JITTERS / 1 HOUR</span>
          {isComplete ? (
            <button className="har-reset-button" type="button" onClick={resetExperiment}>
              Reset experiment
            </button>
          ) : null}
        </div>

        <div className="jitter-bars" aria-label="Timing jitter counts for six sensor prototypes">
          {sensors.map((sensor, index) => (
            <div className={`jitter-row ${index === 1 ? 'is-outlier' : ''}`} key={sensor.id}>
              <span>{sensor.id}</span>
              <i style={{ '--bar-width': `${(sensor.jitters / maxJitters) * 100}%` }} />
              <strong>{sensor.jitters}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
