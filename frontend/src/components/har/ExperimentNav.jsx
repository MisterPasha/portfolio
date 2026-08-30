import { useEffect, useRef } from 'react'

const experiments = [
  { id: 'hardware', number: '01', desktopLabel: 'Hardware Drift', mobileLabel: 'Drift' },
  { id: 'impact', number: '02', desktopLabel: 'Model Impact', mobileLabel: 'Model' },
  { id: 'sensors', number: '03', desktopLabel: 'Fewer Sensors', mobileLabel: 'Sensors' },
  { id: 'transitions', number: '04', desktopLabel: 'Transitions', mobileLabel: 'Transitions' },
  { id: 'robustness', number: '05', desktopLabel: 'Robustness', mobileLabel: 'Robustness' },
  { id: 'results', number: '06', desktopLabel: 'Results', mobileLabel: 'Results', hasDivider: true },
]

export default function ExperimentNav({ activeExperiment, setActiveExperiment }) {
  const tabRefs = useRef([])
  const activeIndex = experiments.findIndex((experiment) => experiment.id === activeExperiment)

  useEffect(() => {
    tabRefs.current[activeIndex]?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [activeIndex])

  const focusExperiment = (index) => {
    const nextIndex = (index + experiments.length) % experiments.length
    setActiveExperiment(experiments[nextIndex].id)
    tabRefs.current[nextIndex]?.focus()
  }

  const handleKeyDown = (event, index) => {
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      focusExperiment(index + 1)
    }

    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) {
      event.preventDefault()
      focusExperiment(index - 1)
    }
  }

  return (
    <nav className="har-experiment-nav" aria-label="Experiments">
      <p>EXPERIMENTS</p>
      <div className="har-experiment-tablist" role="tablist" aria-label="HAR experiment selector">
        {experiments.map((experiment, index) => (
          <button
            className={`har-experiment-tab ${experiment.id === activeExperiment ? 'is-active' : ''} ${experiment.hasDivider ? 'has-divider' : ''}`}
            type="button"
            role="tab"
            id={`har-${experiment.id}-tab`}
            aria-selected={experiment.id === activeExperiment}
            aria-controls={`har-${experiment.id}-panel`}
            tabIndex={experiment.id === activeExperiment ? 0 : -1}
            ref={(node) => {
              tabRefs.current[index] = node
            }}
            onClick={() => setActiveExperiment(experiment.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            key={experiment.id}
          >
            <span>{experiment.number}</span>
            <strong>{experiment.desktopLabel}</strong>
            <em>{experiment.mobileLabel}</em>
          </button>
        ))}
      </div>
    </nav>
  )
}
