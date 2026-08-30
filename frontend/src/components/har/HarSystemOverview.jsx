import { useEffect, useRef, useState } from 'react'
import prototypeImage from '@/assets/section2imu.JPG'
import { harProjectData } from './harProjectData'

const callouts = [
  {
    title: 'RFduino',
    detail: 'sampling + timestamps',
    anchor: { x: '35%', y: '34%' },
    label: { x: '7%', y: '16%' },
    highlightSide: 'left',
  },
  {
    title: 'MPU-9150',
    detail: '9-axis movement',
    anchor: { x: '58%', y: '46%' },
    label: { x: '68%', y: '18%' },
    highlightSide: 'right',
  },
  {
    title: 'BLE',
    detail: 'wireless stream',
    anchor: { x: '72%', y: '58%' },
    label: { x: '74%', y: '73%' },
  },
  {
    title: 'Python receiver',
    detail: 'async sensor collection',
    anchor: { x: '46%', y: '68%' },
    label: { x: '8%', y: '76%' },
  },
]

const pipelineStages = ['MOVEMENT', 'IMU', 'RFDUINO', 'BLE', 'EDGE COMPUTER', 'HAR MODEL']

const timingRows = [
  { label: 'ACC + GYRO', value: 2 },
  { label: 'MAGNETOMETER', value: 11 },
]

export default function HarSystemOverview() {
  const pipelineRef = useRef(null)
  const timingRef = useRef(null)
  const [hasPipelineEntered, setHasPipelineEntered] = useState(false)
  const [hasTimingEntered, setHasTimingEntered] = useState(false)

  useEffect(() => {
    const pipeline = pipelineRef.current
    const timing = timingRef.current
    const observedElements = []

    const pipelineObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasPipelineEntered(true)
          pipelineObserver.disconnect()
        }
      },
      {
        rootMargin: '0px 0px -20% 0px',
        threshold: 0,
      },
    )

    const timingObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasTimingEntered(true)
          timingObserver.disconnect()
        }
      },
      {
        rootMargin: '0px 0px -20% 0px',
        threshold: 0,
      },
    )

    if (pipeline) {
      pipelineObserver.observe(pipeline)
      observedElements.push(pipelineObserver)
    }

    if (timing) {
      timingObserver.observe(timing)
      observedElements.push(timingObserver)
    }

    return () => {
      observedElements.forEach((observer) => observer.disconnect())
    }
  }, [])

  return (
    <section
      className={`har-system-section ${hasPipelineEntered ? 'has-pipeline-entered' : ''} ${hasTimingEntered ? 'has-timing-entered' : ''}`}
      id="har-system"
      aria-labelledby="har-system-title"
    >
      <div className="har-system-copy">
        <p className="har-section-label">THE SYSTEM</p>
        <h2 id="har-system-title">So I built the sensor network first.</h2>
        <p>
          Each prototype combined an MPU-9150 IMU with an RFduino microcontroller and streamed motion data to a computer over Bluetooth Low Energy.
        </p>
        <p>
          That gave me access to the full path from physical movement → sensor → microcontroller → wireless connection → machine-learning pipeline.
        </p>
      </div>

      <div className="har-system-photo-panel">
        <div className="prototype-photo-frame">
          <img
            src={prototypeImage}
            alt=""
            className="prototype-photo"
          />
          <div className="prototype-photo-placeholder">Sensor prototype image</div>
          <div className="prototype-hover-zone prototype-hover-zone-left" />
          <div className="prototype-hover-zone prototype-hover-zone-right" />

          <div className="prototype-callouts" aria-hidden="true">
            {callouts.map((callout) => (
              <span
                className={`prototype-callout ${callout.highlightSide ? `highlight-${callout.highlightSide}` : ''}`}
                style={{
                  '--anchor-x': callout.anchor.x,
                  '--anchor-y': callout.anchor.y,
                  '--label-x': callout.label.x,
                  '--label-y': callout.label.y,
                }}
                key={callout.title}
              >
                <i />
                <b>
                  {callout.title}
                  <small>{callout.detail}</small>
                </b>
              </span>
            ))}
          </div>
        </div>

        <ul className="prototype-callout-list" aria-label="Prototype annotations">
          {callouts.map((callout) => (
            <li key={callout.title}>
              <strong>{callout.title}</strong>
              <span>{callout.detail}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="har-pipeline" ref={pipelineRef} aria-label="Data path from movement to HAR model">
        <div className="pipeline-track">
          {pipelineStages.map((stage, index) => (
            <div className="pipeline-stage" style={{ '--stage-index': index }} key={stage}>
              <span>{stage}</span>
            </div>
          ))}
          <i className="pipeline-packet" />
        </div>
      </div>

      <div className="hardware-timing">
        <div>
          <p className="har-section-label">DATA EXTRACTION</p>
          <h3>Even reading the sensors takes time.</h3>
          <p>
            The magnetometer took roughly five times longer to retrieve than the accelerometer and gyroscope together, which helped define a more realistic stable sampling rate for the prototypes.
          </p>
          <small>
            Stable experimental sampling: {harProjectData.hardware.frequencyHz} Hz / {harProjectData.hardware.expectedIntervalMs} ms per frame
          </small>
        </div>

        <div className="timing-bars" ref={timingRef} aria-label="Sensor data extraction timing comparison">
          {timingRows.map((row) => (
            <div className="timing-row" key={row.label}>
              <div>
                <span>{row.label}</span>
                <strong>≈ {row.value} ms</strong>
              </div>
              <i style={{ width: `${(row.value / 11) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="system-transition">
        <p>Now I could start breaking it.</p>
        <span>Scroll into the Experiment Lab.</span>
      </div>
    </section>
  )
}
