import { useEffect, useRef, useState } from 'react'

const presets = [
  {
    question: 'What was Pavel developing before he started developing software?',
    answer: 'Before Python, Docker and vector databases, Pavel spent nearly a decade developing dishes in professional kitchens. The tooling changed quite a bit.',
  },
  {
    question: 'What does Pavel consider a reasonable next step?',
    answer: 'If something works locally, make it reproducible. If it is reproducible, deploy it. If deployment is repetitive, automate it.',
  },
  {
    question: 'What does Pavel do with things he doesn’t understand yet?',
    answer: 'Usually builds something with them until they make sense.',
  },
]

const pipeline = ['QUERY', 'EMBED', 'SEARCH', 'RETRIEVE', 'AUGMENT', 'GENERATE', 'ANSWER']

const chunks = [
  { id: 'chunk_07', copy: 'Illustrative deployment note: package the application into a container.', strength: '█████████░', selected: true },
  { id: 'chunk_12', copy: 'Illustrative hosting note: a cloud compute instance runs the containerised application.', strength: '████████░░', selected: true },
  { id: 'chunk_21', copy: 'Illustrative delivery note: build and publish an image after code changes.', strength: '██████░░░░', selected: false },
  { id: 'chunk_34', copy: 'Illustrative local note: test the application before deployment.', strength: '████░░░░░░', selected: false },
]

export default function DigisoftRagVisualisation() {
  const [presetIndex, setPresetIndex] = useState(0)
  const [stage, setStage] = useState(0)
  const [isExplainerOpen, setIsExplainerOpen] = useState(false)
  const timeoutsRef = useRef([])

  const clearDemo = () => {
    timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout))
    timeoutsRef.current = []
  }

  useEffect(() => clearDemo, [])

  const runDemo = () => {
    clearDemo()
    setStage(1)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage(7)
      return
    }

    const delays = [1050, 2100, 3375, 4650, 5925, 7275]
    timeoutsRef.current = delays.map((delay, index) => window.setTimeout(() => setStage(index + 2), delay))
  }

  const choosePreset = (index) => {
    clearDemo()
    setPresetIndex(index)
    setStage(0)
  }

  const activePreset = presets[presetIndex]
  const status = stage === 0 ? 'ready for an illustrative run' : `${pipeline[stage - 1].toLowerCase()} step in progress`

  return (
    <section className="digisoft-rag-visualisation" aria-labelledby="rag-visualisation-title">
      <div className="digisoft-rag-heading">
        <div>
          <p>PIPELINE VISUALISATION</p>
          <h2 id="rag-visualisation-title">A question is retrieved before it is generated.</h2>
        </div>
        <span aria-live="polite">{status}</span>
      </div>

      <div className="rag-demo-area">
        <p className="rag-demo-instruction">Please pick an example question and click 'RUN PIPELINE' to animate RAG pipeline</p>
        <div className="rag-demo-controls">
        <div className="rag-question-field" aria-label="Selected knowledge base question">
          <span>&gt;</span>
          <p>{activePreset.question}</p>
        </div>
        <button className="rag-run-button" type="button" onClick={runDemo}>
          {stage > 0 ? '[ RUN AGAIN ]' : '[ RUN PIPELINE ]'}
        </button>
        </div>
      </div>

      <div className="rag-presets" aria-label="Example questions">
        {presets.map((preset, index) => (
          <button
            className={presetIndex === index ? 'is-active' : ''}
            type="button"
            aria-pressed={presetIndex === index}
            onClick={() => choosePreset(index)}
            key={preset.question}
          >
            {preset.question}
          </button>
        ))}
      </div>

      <div className={`rag-workbench stage-${stage}`}>
        <div className="rag-pipeline-rail" aria-label="RAG pipeline stages">
          {pipeline.map((label, index) => (
            <div className={stage >= index + 1 ? 'is-complete' : ''} key={label}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>

        <div className="rag-process-area">
          <div className="rag-query-panel">
            <p>01 / QUERY</p>
            <span>{activePreset.question}</span>
            <i className="rag-query-packet" aria-hidden="true" />
          </div>

          <div className="rag-vector-panel">
            <p>02 / EMBED</p>
            <strong>[0.12, -0.48, 0.71, ...]</strong>
            <small>illustrative vector representation</small>
          </div>

          <div className="rag-search-panel">
            <div className="rag-panel-label">
              <p>03 / SEARCH</p>
              <span>FAISS similarity lookup</span>
            </div>
            <div className="rag-chunk-list">
              {chunks.map((chunk) => (
                <article className={`rag-chunk ${chunk.selected ? 'is-selected' : ''}`} key={chunk.id}>
                  <div>
                    <strong>{chunk.id}</strong>
                    <span>{chunk.strength}</span>
                  </div>
                  <p>{chunk.copy}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rag-context-panel">
            <p>04 / RETRIEVE</p>
            <strong>CONTEXT</strong>
            <div>
              {chunks.filter((chunk) => chunk.selected).map((chunk) => <span key={chunk.id}>{chunk.id}</span>)}
            </div>
            <small>selected illustrative chunks</small>
          </div>

          <div className="rag-augment-panel">
            <p>05 / AUGMENT</p>
            <div>
              <span>QUESTION</span>
              <i>+</i>
              <span>RETRIEVED CONTEXT</span>
            </div>
          </div>

          <div className="rag-generation-panel">
            <p>06 / GENERATE</p>
            <strong>OLLAMA</strong>
            <span>llama3.2:1b</span>
            <i className="rag-generate-packet" aria-hidden="true" />
          </div>

          <div className="rag-answer-panel">
            <p>07 / ANSWER</p>
            <span>{activePreset.answer}</span>
          </div>
        </div>
      </div>

      <p className="rag-supporting-copy">
        Documents are extracted, split into chunks and embedded using nomic-embed-text. FAISS stores the vector representation and retrieves the most relevant context before the question reaches the language model.
      </p>

      <div className="rag-explainer">
        <button
          type="button"
          aria-expanded={isExplainerOpen}
          onClick={() => setIsExplainerOpen((isOpen) => !isOpen)}
        >
          How does this work? <span>{isExplainerOpen ? '−' : '+'}</span>
        </button>
        <div className={isExplainerOpen ? 'is-open' : ''}>
          <p>
            PyMuPDF extracts document text, which is split into manageable chunks. nomic-embed-text turns both chunks and questions into embeddings so semantic similarity can be compared. FAISS retrieves the most relevant chunks, that context is added to the question, and Ollama generates a response from the combined prompt.
          </p>
        </div>
      </div>
    </section>
  )
}
