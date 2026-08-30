import { useEffect, useRef, useState } from 'react'
import { harProjectData } from './harProjectData'

const maxMeasuredOffset = Math.max(...harProjectData.hardware.offsetsAfterOneHour)
const samplePoints = Array.from({ length: 6 }, (_, index) => index)

export default function SensorDriftExplanation() {
  const sectionRef = useRef(null)
  const labRef = useRef(null)
  const [driftRatio, setDriftRatio] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const lab = labRef.current
    if (!lab) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      {
        rootMargin: '0px 0px -20% 0px',
        threshold: 0,
      },
    )

    observer.observe(lab)
    return () => observer.disconnect()
  }, [])

  const misalignmentMs = Math.round(driftRatio * maxMeasuredOffset)
  const timelineShift = driftRatio * 11
  const shouldShowHelper = misalignmentMs >= 48

  return (
    <section
      className={`sensor-drift-section ${isVisible ? 'is-visible' : ''}`}
      id="har-problem"
      ref={sectionRef}
      aria-labelledby="har-problem-title"
    >
      <div className="sensor-drift-copy">
        <p className="har-section-label">THE PROBLEM</p>
        <h2 id="har-problem-title">Computers aren't quite as good at keeping time as they look.</h2>
        <p>Every sensor has its own tiny clock, and those clocks are never perfectly identical.</p>
        <p>
          One sensor can run fractionally faster than another. Add processing delays and occasional timing jitter, and streams that started together slowly move apart.
        </p>
        <p>
          That becomes a problem when an ML model expects readings from several sensors to describe the same moment in time.
        </p>
      </div>

      <div className="drift-lab" ref={labRef} aria-label="Sensor timeline misalignment demonstration">
        <div className="drift-readout" aria-live="polite">
          <span>MISALIGNMENT</span>
          <strong>{misalignmentMs} ms</strong>
        </div>

        <div className="timeline-stage">
          <div className="alignment-guides" aria-hidden="true">
            {samplePoints.map((point) => (
              <span style={{ left: `${point * 20}%` }} key={point} />
            ))}
          </div>

          <div className="timeline-row">
            <span className="timeline-label">SENSOR A</span>
            <div className="timeline-track">
              {samplePoints.map((point) => (
                <i style={{ left: `${point * 20}%` }} key={point} />
              ))}
            </div>
          </div>

          <div className="timeline-row">
            <span className="timeline-label">SENSOR B</span>
            <div
              className="timeline-track"
              style={{ transform: `translateX(${timelineShift}%)` }}
            >
              {samplePoints.map((point) => (
                <i style={{ left: `${point * 20}%` }} key={point} />
              ))}
            </div>
          </div>

          <div
            className={`timeline-helper ${shouldShowHelper ? 'is-visible' : ''}`}
            aria-hidden={!shouldShowHelper}
          >
            same index ≠ same moment
          </div>
        </div>

        <label className="drift-control">
          <span>TIME</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(driftRatio * 100)}
            onChange={(event) => setDriftRatio(Number(event.target.value) / 100)}
            aria-label="Time progression from start to hours later"
          />
          <em>
            <span>START</span>
            <span>HOURS LATER</span>
          </em>
        </label>

        <p className="drift-note">
          133 ms is the maximum offset measured in my one-hour six-prototype experiment, not a claim that every device always drifts by that amount.
        </p>
      </div>

      <p className="drift-punchline">
        Nothing is necessarily wrong with either measurement.
        <span>
          They're just no longer describing the <strong>same moment.</strong>
        </span>
      </p>
    </section>
  )
}
