import { useState } from 'react'
import { ArchitectureCanvas } from './DigisoftArchitecture'

const views = [
  { id: 'rag', label: 'RAG' },
  { id: 'application', label: 'APPLICATION' },
  { id: 'infrastructure', label: 'INFRASTRUCTURE' },
  { id: 'cicd', label: 'CI/CD' },
  { id: 'all', label: 'ALL' },
]

const learningAreas = [
  {
    label: 'RETRIEVAL',
    title: 'Give the model external knowledge.',
    description: 'I wanted to understand how an application could retrieve useful information from documents instead of relying entirely on what the language model already knew.',
    metadata: 'LangChain / FAISS / embeddings / RAG',
  },
  {
    label: 'CONTAINERS',
    title: 'Make the environment reproducible.',
    description: 'Containerising the application forced me to think beyond the Python code itself — dependencies, services, configuration and how the application actually runs elsewhere.',
    metadata: 'Docker / Docker Compose',
  },
  {
    label: 'CLOUD',
    title: 'Move beyond localhost.',
    description: 'Deploying the project onto AWS helped me understand the practical steps between a working local prototype and an application hosted on remote infrastructure.',
    metadata: 'AWS / EC2',
  },
  {
    label: 'AUTOMATION',
    title: 'Remove repetitive deployment work.',
    description: 'GitHub Actions gave me practical experience with the foundations of CI/CD: triggering a workflow from code changes, building the application and moving it toward deployment automatically.',
    metadata: 'GitHub Actions / containers / deployment',
  },
]

export default function DigisoftFinalChapter() {
  const [view, setView] = useState('all')
  const [activeLearningArea, setActiveLearningArea] = useState(0)

  const scrollToExperiments = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('projects-navbar')?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    })
  }

  return (
    <section className="digisoft-final-chapter" aria-labelledby="digisoft-explorer-title">
      <div className="digisoft-explorer-heading">
        <p>ARCHITECTURE EXPLORER</p>
        <h2 id="digisoft-explorer-title">Inspect the system from different angles.</h2>
      </div>

      <div className="digisoft-explorer-controls" aria-label="Architecture view selector">
        <span>VIEW:</span>
        <div>
          {views.map((item) => (
            <button
              className={view === item.id ? 'is-active' : ''}
              type="button"
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
              key={item.id}
            >
              [ {item.label} ]
            </button>
          ))}
        </div>
      </div>

      <ArchitectureCanvas activeStage={5} view={view} compact />

      <div className="digisoft-final-insights">
        <div className="digisoft-positioning">
          <p>The goal wasn't scale. It was understanding the whole path.</p>
          <span>I used this project to go beyond model experimentation and understand what happens between writing AI code and actually making that code available to someone else.</span>
        </div>

        <div className="digisoft-learning-panel">
          <div className="digisoft-learning-heading">
            <p>WHAT I WAS ACTUALLY LEARNING</p>
            <span>Select an area to inspect.</span>
          </div>

          <div className="digisoft-learning-columns">
            {learningAreas.map((area, index) => (
              <button
                className={activeLearningArea === index ? 'is-active' : ''}
                type="button"
                aria-expanded={activeLearningArea === index}
                onClick={() => setActiveLearningArea(index)}
                onMouseEnter={() => setActiveLearningArea(index)}
                onFocus={() => setActiveLearningArea(index)}
                key={area.label}
              >
                <span>{String(index + 1).padStart(2, '0')} / {area.label}</span>
                <strong>{area.title}</strong>
                <em>{area.description}</em>
                <small>{area.metadata}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="digisoft-back-to-experiments" type="button" onClick={scrollToExperiments}>
        [ PROJECT EXPERIMENTS ↑ ]
      </button>
    </section>
  )
}
