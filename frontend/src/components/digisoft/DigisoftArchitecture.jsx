import { useEffect, useRef, useState } from 'react'

const stages = [
  {
    number: '01',
    nav: 'Chat',
    title: 'Start small.',
    text: 'The first goal was simple: experiment with a small language model running locally and build a usable interface around it.',
  },
  {
    number: '02',
    nav: 'Ground it',
    title: 'Then I wanted it to know something useful.',
    text: 'A general model was interesting, but I wanted to ask questions about my own documents. That pushed the prototype toward retrieval-augmented generation.',
  },
  {
    number: '03',
    nav: 'Package it',
    title: "Working on my machine wasn't enough.",
    text: 'Once the RAG pipeline worked, I wanted a reproducible application environment instead of a collection of local setup steps.',
  },
  {
    number: '04',
    nav: 'Ship it',
    title: "localhost wasn't enough.",
    text: 'The next step was making the system accessible outside my development machine, so I deployed the containerised application onto AWS EC2.',
  },
  {
    number: '05',
    nav: 'Automate it',
    title: 'Deployment became another problem to automate.',
    text: 'Once code changes meant rebuilding and redeploying the application, repeating those steps manually stopped making sense. I introduced a GitHub Actions workflow to automate the delivery path.',
  },
]

const nodeDescriptions = {
  'FAISS': 'Vector similarity search used to retrieve the most relevant document chunks.',
  'OLLAMA': 'Local model runtime used to run llama3.2:1b.',
  'nomic-embed-text': 'Turns queries and document chunks into embeddings for semantic comparison.',
  'DOCKER': 'Packages the application environment so it can run consistently outside the development machine.',
  'GITHUB ACTIONS': 'Automates the build and deployment workflow when the code changes.',
  'AWS EC2': 'Cloud compute instance used to host the containerised application.',
}

const stageForNode = {
  user: 1,
  streamlit: 1,
  ollama: 1,
  llama: 1,
  langchain: 2,
  documents: 2,
  pymupdf: 2,
  chunks: 2,
  embed: 2,
  faiss: 2,
  query: 2,
  queryembed: 2,
  retrieval: 2,
  context: 2,
  llm: 2,
  answer: 2,
  docker: 3,
  aws: 4,
  git: 5,
  github: 5,
  actions: 5,
  build: 5,
  ghcr: 5,
  running: 5,
}

function DiagramNode({ id, label, activeStage, selectedNode, onSelect }) {
  const description = nodeDescriptions[label]
  const isVisible = activeStage >= stageForNode[id]
  const isSelected = selectedNode === id && isVisible
  const className = `digisoft-diagram-node node-${id} ${isVisible ? 'is-visible' : ''} ${isSelected ? 'is-selected' : ''} ${description ? 'has-detail' : ''}`

  if (!description) {
    return <div className={className}>{label}</div>
  }

  return (
    <button
      className={className}
      type="button"
      aria-pressed={isSelected}
      aria-label={`${label}: ${description}`}
      onClick={() => onSelect(isSelected ? null : id)}
    >
      <span>{label}</span>
      <small>{description}</small>
    </button>
  )
}

export function ArchitectureCanvas({ activeStage, view = 'all', compact = false }) {
  const canvasRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.12 },
    )

    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={canvasRef} className={`digisoft-architecture-canvas stage-${activeStage} ${isInView ? 'is-in-view' : ''} ${compact ? 'is-compact' : ''} architecture-view-${view}`} aria-label={`Architecture at stage ${activeStage}`}>
      <div className="digisoft-canvas-meta">
        <span>system.map / v0.{activeStage}</span>
        <i>interactive nodes ↗</i>
      </div>

      <div className="digisoft-local-boundary" aria-hidden="true">
        <span>LOCAL MACHINE</span>
        <small>localhost:8501</small>
      </div>
      <div className="digisoft-docker-boundary" aria-hidden="true">
        <span>DOCKER / DOCKER COMPOSE</span>
        <small>environment: reproducible ✓</small>
      </div>
      <div className="digisoft-cloud-boundary" aria-hidden="true">
        <span>AWS / CLOUD ENVIRONMENT</span>
        <small>containerised application</small>
      </div>

      <svg className="digisoft-architecture-lines" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
        <g className="line-set line-chat">
          <path d="M145 370 H330 M330 370 H632 M632 370 H812" />
        </g>
        <g className="line-set line-rag">
          <path d="M220 120 H348 H476 H610 V255" />
          <path d="M610 285 V325 H522" />
          <path d="M145 500 H278 H410 H542 H690 H846" />
          <path d="M410 500 V405 H522" />
          <path d="M620 405 V500" />
          <path d="M690 500 V405 H632" />
        </g>
        <g className="line-set line-ship">
          <path d="M80 582 H172" />
          <path d="M826 566 V500" />
        </g>
        <g className="line-set line-cicd">
          <path d="M116 672 H220 H332 H448 H565 H765 V574 H900" />
        </g>
      </svg>

      <div className="digisoft-packet packet-query" aria-hidden="true" />
      <div className="digisoft-packet packet-deploy" aria-hidden="true" />

      <DiagramNode id="user" label="USER" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="streamlit" label="STREAMLIT" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="langchain" label="LANGCHAIN" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="ollama" label="OLLAMA" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="llama" label="llama3.2:1b" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />

      <DiagramNode id="documents" label="DOCUMENTS" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="pymupdf" label="PyMuPDF" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="chunks" label="CHUNKS" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="embed" label="nomic-embed-text" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="faiss" label="FAISS" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />

      <DiagramNode id="query" label="USER QUERY" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="queryembed" label="embedding" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="retrieval" label="FAISS RETRIEVAL" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="context" label="RELEVANT CONTEXT" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="llm" label="LLM" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="answer" label="ANSWER" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />

      <DiagramNode id="docker" label="DOCKER" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="aws" label="AWS EC2" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />

      <DiagramNode id="git" label="GIT PUSH" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="github" label="GITHUB" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="actions" label="GITHUB ACTIONS" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="build" label="BUILD CONTAINER" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="ghcr" label="GHCR / REGISTRY" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />
      <DiagramNode id="running" label="RUNNING APP" activeStage={activeStage} selectedNode={selectedNode} onSelect={setSelectedNode} />

      <div className="digisoft-terminal" aria-label="Deployment terminal output">
        <p>pavel@dev ~ $ git push origin main</p>
        <span>→ detecting changes</span>
        <span>✓ building image</span>
        <span>✓ pushing container</span>
        <span>✓ deploying service</span>
        <strong>deployment complete</strong>
      </div>
    </div>
  )
}

export default function DigisoftArchitecture() {
  const sectionRef = useRef(null)
  const stageRefs = useRef([])
  const [activeStage, setActiveStage] = useState(1)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveStage(Number(visible.target.dataset.stage))
      },
      { rootMargin: '-28% 0px -34% 0px', threshold: [0.15, 0.5, 0.85] },
    )

    stageRefs.current.forEach((stage) => stage && observer.observe(stage))
    return () => observer.disconnect()
  }, [])

  const selectStage = (stageNumber) => {
    setActiveStage(stageNumber)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    stageRefs.current[stageNumber - 1]?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    })
  }

  return (
    <section className="digisoft-architecture-story" ref={sectionRef} aria-labelledby="digisoft-architecture-title">
      <div className="digisoft-architecture-intro">
        <p>THE BUILD KEPT GROWING</p>
        <h2 id="digisoft-architecture-title">One prototype. More engineering questions.</h2>
      </div>

      <div className="digisoft-architecture-layout">
        <aside className="digisoft-architecture-sticky">
          <nav className="digisoft-architecture-nav" aria-label="Architecture stages">
            {stages.map((stage, index) => (
              <button
                key={stage.number}
                className={activeStage === index + 1 ? 'is-active' : ''}
                type="button"
                aria-current={activeStage === index + 1 ? 'step' : undefined}
                onClick={() => selectStage(index + 1)}
              >
                <span>{stage.number}</span> {stage.nav}
              </button>
            ))}
          </nav>
          <ArchitectureCanvas activeStage={activeStage} />
        </aside>

        <div className="digisoft-architecture-stages">
          {stages.map((stage, index) => (
            <article
              className={`digisoft-architecture-stage ${activeStage === index + 1 ? 'is-active' : ''}`}
              data-stage={index + 1}
              ref={(element) => { stageRefs.current[index] = element }}
              key={stage.number}
            >
              <p>{stage.number} / {stage.nav.toUpperCase()}</p>
              <h3>{stage.title}</h3>
              <span>{stage.text}</span>
              {index === 2 && <small>environment: reproducible ✓</small>}
              {index === 3 && <small>deployment scope: small cloud instance</small>}
              {index === 4 && <small>CI/CD foundations, not an enterprise platform.</small>}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
