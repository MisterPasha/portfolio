import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import ExperimentNav from './ExperimentNav'
import HardwareDriftExperiment from './HardwareDriftExperiment'
import ModelImpactExperiment from './ModelImpactExperiment'
import ReducedSensorsExperiment from './ReducedSensorsExperiment'
import TransitionExperiment from './TransitionExperiment'
import AugmentationExperiment from './AugmentationExperiment'
import HarResults from './HarResults'

const experimentPanels = {
  hardware: <HardwareDriftExperiment />,
  impact: <ModelImpactExperiment />,
  sensors: <ReducedSensorsExperiment />,
  transitions: <TransitionExperiment />,
  robustness: <AugmentationExperiment />,
  results: <HarResults />,
}

function ExperimentPlaceholder({ experiment }) {
  return (
    <div className="har-lab-placeholder">
      <p className="har-section-label">{experiment.eyebrow}</p>
      <h2>{experiment.title}</h2>
      <p>This experiment panel is ready for the next build pass.</p>
    </div>
  )
}

export default function HarExperimentLab() {
  const [activeExperiment, setActiveExperiment] = useState('hardware')
  const panel = experimentPanels[activeExperiment]

  const scrollToSection = (sectionId) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <section className="har-experiment-lab" id="har-experiment-lab" aria-label="Experiment Lab">
      <div className="har-lab-shell">
        <ExperimentNav activeExperiment={activeExperiment} setActiveExperiment={setActiveExperiment} />

        <div className="har-lab-panel-shell">
          <AnimatePresence initial={false}>
            <motion.div
              key={activeExperiment}
              id={`har-${activeExperiment}-panel`}
              role="tabpanel"
              aria-labelledby={`har-${activeExperiment}-tab`}
              tabIndex={0}
              className="har-lab-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            >
              {typeof panel === 'object' && panel.eyebrow ? <ExperimentPlaceholder experiment={panel} /> : panel}
            </motion.div>
          </AnimatePresence>

          <div className="har-panel-jump-controls" aria-label="Section navigation">
            <button type="button" onClick={() => scrollToSection('experiments-navbar')}>
              [ EXPERIMENTS ↑ ]
            </button>
            <button type="button" onClick={() => scrollToSection('projects-navbar')}>
              [ PROJECTS ↑ ]
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
