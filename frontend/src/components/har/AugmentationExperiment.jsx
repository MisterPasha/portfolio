import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { harProjectData } from './harProjectData'

const methods = [
  { title: 'UPSAMPLING', detail: 'sensor runs slightly faster' },
  { title: 'DOWNSAMPLING', detail: 'sensor runs slightly slower / samples disappear' },
  { title: 'FREQUENCY WARPING', detail: 'movement is stretched or compressed in time' },
  { title: 'RANDOM DROPOUT', detail: 'individual readings disappear' },
]

const testConditions = [
  {
    id: 'six',
    label: '6 DRIFTING',
    detail: '6 misaligned sensors',
    normal: harProjectData.augmentation.six.normal,
    augmented: harProjectData.augmentation.six.augmented,
  },
  {
    id: 'nine',
    label: '9 DRIFTING',
    detail: '9 misaligned sensors',
    normal: harProjectData.augmentation.nine.normal,
    augmented: harProjectData.augmentation.nine.augmented,
  },
  {
    id: 'doubleDrift',
    label: '2x DRIFT',
    detail: '6 sensors / 2x misalignment strength',
    normal: harProjectData.augmentation.doubleDrift.normal,
    augmented: harProjectData.augmentation.doubleDrift.augmented,
  },
]

function toPercent(value) {
  return Math.round(value * 100)
}

export default function AugmentationExperiment() {
  const prefersReducedMotion = useReducedMotion()
  const trainingTimer = useRef(null)
  const replayTimer = useRef(null)
  const [trainingState, setTrainingState] = useState('idle')
  const [demoRunKey, setDemoRunKey] = useState(0)
  const [activeCondition, setActiveCondition] = useState('six')
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const condition = testConditions.find((item) => item.id === activeCondition)
  const normalAccuracy = toPercent(condition.normal)
  const augmentedAccuracy = toPercent(condition.augmented)
  const hasTrained = trainingState === 'complete'

  useEffect(
    () => () => {
      if (trainingTimer.current) {
        window.clearTimeout(trainingTimer.current)
      }
      if (replayTimer.current) {
        window.clearTimeout(replayTimer.current)
      }
    },
    [],
  )

  const runTrainingDemo = () => {
    if (trainingState === 'running') return

    if (trainingTimer.current) {
      window.clearTimeout(trainingTimer.current)
    }
    if (replayTimer.current) {
      window.clearTimeout(replayTimer.current)
    }

    if (prefersReducedMotion) {
      setTrainingState('complete')
      return
    }

    setTrainingState('idle')
    replayTimer.current = window.setTimeout(() => {
      setDemoRunKey((current) => current + 1)
      setTrainingState('running')
      replayTimer.current = null

      trainingTimer.current = window.setTimeout(() => {
        setTrainingState('complete')
        trainingTimer.current = null
      }, 2800)
    }, 40)
  }

  const resetTrainingDemo = () => {
    if (trainingTimer.current) {
      window.clearTimeout(trainingTimer.current)
      trainingTimer.current = null
    }
    if (replayTimer.current) {
      window.clearTimeout(replayTimer.current)
      replayTimer.current = null
    }

    setTrainingState('idle')
    setActiveCondition('six')
  }

  return (
    <div className={`augmentation-experiment ${trainingState !== 'idle' ? 'has-started' : ''} ${hasTrained ? 'is-complete' : ''}`}>
      <div className="augmentation-copy">
        <p className="har-section-label">EXP 05 / ROBUSTNESS</p>
        <h2>What if the model learned that sensors aren't perfect?</h2>
        <p>Instead of trying to perfectly synchronise every device, I also tested a software-side approach.</p>
        <p>
          During training I deliberately distorted sensor data so the model would encounter some of the same mess it might see after deployment.
        </p>
        <strong>Basically: train for imperfection.</strong>
      </div>

      <div className="augmentation-methods" aria-label="Augmentation methods">
        {methods.map((method) => (
          <div className="augmentation-method-card" key={method.title}>
            <span>{method.title}</span>
            <p>{method.detail}</p>
          </div>
        ))}
      </div>

      <div className="augmentation-main-grid">
        <div className="augmentation-demo-panel">
          <div className="augmentation-demo-header">
            <div>
              <span>TEST CONDITION</span>
              <strong>6 MISALIGNED SENSORS</strong>
            </div>
            <div className="normal-training-result">
              <p>NORMAL NON-AUGMENTED TRAINING RESULT</p>
              <b>74%</b>
            </div>
          </div>

          <div className="signal-chaos-demo" aria-label="Illustrative sensor augmentation visual" key={demoRunKey}>
            <div className="clean-signal-row">
              <span>CLEAN SIGNAL</span>
              <svg viewBox="0 0 360 58" preserveAspectRatio="none">
                <path d="M0 34 C34 34 44 14 78 14 C110 14 118 44 150 44 C184 44 190 18 222 18 C258 18 270 40 304 40 C330 40 342 30 360 30" />
              </svg>
            </div>

            <div className="signal-copy-stack">
              {['stretch', 'compress', 'dropout'].map((variant) => (
                <div className={`chaos-signal ${variant}`} key={variant}>
                  <svg viewBox="0 0 360 58" preserveAspectRatio="none">
                    <path d="M0 34 C34 34 44 14 78 14 C110 14 118 44 150 44 C184 44 190 18 222 18 C258 18 270 40 304 40 C330 40 342 30 360 30" />
                  </svg>
                  <i />
                  <i />
                  <i />
                </div>
              ))}
            </div>

            <div className="model-node" aria-hidden="true">
              <i />
              <i />
              <i />
              <span>MODEL</span>
            </div>
          </div>

          <button className="train-chaos-button" type="button" disabled={trainingState === 'running'} onClick={runTrainingDemo}>
            {trainingState === 'running' ? 'TRAINING WITH SENSOR CHAOS' : 'TRAIN WITH SENSOR CHAOS →'}
          </button>
        </div>

        <div className={`augmentation-result-panel ${hasTrained ? 'is-visible' : ''}`} aria-live="polite">
          <div className="condition-selector" aria-label="Test condition selector">
            {testConditions.map((item) => (
              <button
                className={activeCondition === item.id ? 'is-active' : ''}
                type="button"
                title={item.detail}
                onClick={() => setActiveCondition(item.id)}
                disabled={!hasTrained}
                key={item.id}
              >
                <span>{item.label}</span>
                {item.id === 'doubleDrift' ? <small>{item.detail}</small> : null}
              </button>
            ))}
          </div>

          <div className="training-comparison-bars">
            <div className="training-bar-row">
              <span>NORMAL</span>
              <i>
                <b style={{ width: `${normalAccuracy}%` }} />
              </i>
              <strong>{normalAccuracy}</strong>
            </div>
            <div className="training-bar-row is-augmented">
              <span>AUGMENTED</span>
              <i>
                <b style={{ width: `${augmentedAccuracy}%` }} />
              </i>
              <strong>{augmentedAccuracy}</strong>
            </div>
          </div>

          <div className="percentage-point-callout">
            <strong>+{augmentedAccuracy - normalAccuracy} percentage points</strong>
            <span>{condition.detail}</span>
          </div>

          {hasTrained ? (
            <button className="reset-training-button" type="button" onClick={resetTrainingDemo}>
              Reset training demo
            </button>
          ) : null}
        </div>
      </div>

      <div className="augmentation-conclusion">
        <div>
          <h3>Training for imperfection worked — up to a point.</h3>
          <p>For moderate drift, augmentation recovered a meaningful amount of lost accuracy.</p>
          <p>But when I doubled the misalignment strength, performance still deteriorated heavily.</p>
          <p>Software can make the system more tolerant, but it can't make synchronisation irrelevant.</p>
        </div>

        <div className="training-data-note">
          <button type="button" aria-expanded={isDetailOpen} onClick={() => setIsDetailOpen(!isDetailOpen)}>
            WHAT WAS THE TRAINING DATA? {isDetailOpen ? '-' : '+'}
          </button>
          <div className={`training-data-copy ${isDetailOpen ? 'is-open' : ''}`}>
            <p>The augmented training set combined the original data with lightly and more heavily transformed versions.</p>
            <p>
              A non-augmented control was also expanded to the same overall training volume so that simply seeing more data was not confused with the
              effect of augmentation itself.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
