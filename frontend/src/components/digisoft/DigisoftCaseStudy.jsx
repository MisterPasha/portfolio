import { useState } from 'react'
import DigisoftArchitecture from './DigisoftArchitecture'
import DigisoftRagVisualisation from './DigisoftRagVisualisation'
import DigisoftFinalChapter from './DigisoftFinalChapter'
import './DigisoftCaseStudy.css'

const stages = [
  {
    name: 'CHATBOT',
    question: 'Can I get a local model talking?',
    context: 'The first experiment: a small language model running locally, with a simple conversation loop.',
  },
  {
    name: 'RAG',
    question: "Can I give it knowledge it wasn't trained on?",
    context: 'Documents became the next problem: extract their text, embed it, retrieve the useful parts, then pass that context into the answer.',
  },
  {
    name: 'DOCKER',
    question: 'Will the same system run outside my machine?',
    context: 'Once the prototype had more moving parts, packaging the environment became part of the experiment.',
  },
  {
    name: 'AWS',
    question: 'Can somebody else actually access it?',
    context: 'The project moved from a local setup to an EC2-hosted application that could be reached beyond my own machine.',
  },
  {
    name: 'CI/CD',
    question: 'Do I really want to redeploy this manually every time?',
    context: 'The last question led to a simple delivery path: build a container image, publish it, then use GitHub Actions to keep deployments repeatable.',
  },
]

const technology = ['Python', 'LangChain', 'FAISS', 'Ollama', 'Docker', 'AWS', 'GitHub Actions']

export default function DigisoftCaseStudy() {
  const [activeStage, setActiveStage] = useState(0)
  const active = stages[activeStage]

  const handleStageKeyDown = (event, index) => {
    let nextIndex = index

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % stages.length
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + stages.length) % stages.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = stages.length - 1

    if (nextIndex === index) return

    event.preventDefault()
    setActiveStage(nextIndex)
    document.getElementById(`digisoft-stage-${nextIndex}`)?.focus()
  }

  return (
    <article className="digisoft-case-study">
      <section className="digisoft-hero" aria-labelledby="digisoft-hero-title">
        <div className="digisoft-copy">
          <p className="digisoft-eyebrow">02 / DIGISOFT</p>
          <h2 id="digisoft-hero-title">
            It started as a chatbot.
            <span>Then I kept adding problems to solve.</span>
          </h2>
          <p className="digisoft-summary">
            I wanted to experiment with running a small language model locally. Once that worked, the obvious next question was whether I could make it answer from my own documents.
          </p>

          <div className="digisoft-tech" aria-label="Technology used">
            {technology.map((item) => <span key={item}>{item}</span>)}
          </div>

          <div className="digisoft-scope" aria-label="Project scope progression">
            <p>ORIGINAL PLAN</p>
            <span>[ build a chatbot ]</span>
            <p>ACTUAL RESULT</p>
            <div aria-hidden="true">
              {stages.map((stage, index) => (
                <span key={stage.name}>
                  [ {stage.name} ]{index < stages.length - 1 && <i>↓</i>}
                </span>
              ))}
            </div>
            <small>scope_creep: successful ✓</small>
          </div>
        </div>

        <div className="digisoft-progression" aria-label="DIGISOFT project progression">
          <div className="digisoft-progression-heading">
            <p>EVOLUTION LOG</p>
            <span>select a stage</span>
          </div>

          <div className="digisoft-stages" role="tablist" aria-label="Project stages">
            {stages.map((stage, index) => (
              <div className="digisoft-stage-group" key={stage.name}>
                <button
                  className={`digisoft-stage ${activeStage === index ? 'is-active' : ''} ${activeStage > index ? 'is-complete' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={activeStage === index}
                  aria-controls="digisoft-stage-context"
                  id={`digisoft-stage-${index}`}
                  onClick={() => setActiveStage(index)}
                  onFocus={() => setActiveStage(index)}
                  onKeyDown={(event) => handleStageKeyDown(event, index)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{stage.name}</strong>
                  <em>{stage.question}</em>
                </button>
                {index < stages.length - 1 && (
                  <div className={`digisoft-connector ${activeStage >= index ? 'is-lit' : ''}`} aria-hidden="true">
                    <i />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            className="digisoft-stage-context"
            id="digisoft-stage-context"
            role="tabpanel"
            aria-labelledby={`digisoft-stage-${activeStage}`}
          >
            <p>{active.name} / CONTEXT</p>
            <span>{active.context}</span>
          </div>
        </div>
      </section>
      <DigisoftArchitecture />
      <DigisoftRagVisualisation />
      <DigisoftFinalChapter />
    </article>
  )
}
