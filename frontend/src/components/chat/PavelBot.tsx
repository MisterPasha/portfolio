import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { ChatApiError, loadSession, sendMessage } from './chatApi'
import type { Message, Session } from './chatApi'
import Icon from './ChatIcon'
import ArchitectureOverview from './ArchitectureOverview'
import FoldedField from './FoldedField'
import './PavelBot.css'

const STORAGE_KEY = 'pavelbot.conversation.v1'
const suggestions = [
  { label: 'The bigger picture', question: 'Tell me about Pavel and what he’s looking for.' },
  { label: 'Projects in practice', question: 'What did Pavel build for the Hi5 project?' },
  { label: 'AI & machine learning', question: "What is Pavel's experience with AI & ML?" },
  { label: 'Data & cloud', question: 'Which data engineering and cloud projects has Pavel worked on?' },
]

function rememberedConversation() { try { return sessionStorage.getItem(STORAGE_KEY) } catch { return null } }
function remember(id: string | null) {
  try {
    if (id) sessionStorage.setItem(STORAGE_KEY, id)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* Chat also works with browser storage disabled. */ }
}

function Introduction() {
  return <div className="pb-introduction">
    <p>Meet <strong>PAVEL.BOT</strong>. Think of him as an extended version of my CV, one you can actually chat with.</p>
    <p>Powered by <span>Retrieval-Augmented Generation (RAG)</span>, he knows about my projects, skills, experience, interests, and even a bit of my personality.</p>
    <p>Consider this a more interactive way to get to know the person behind the CV. Go ahead, ask him about me!</p>
  </div>
}

function Reply({ message, streaming }: { message: Message; streaming: boolean }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text)
      setCopied(true)
      timer.current = setTimeout(() => setCopied(false), 1800)
    } catch { setCopied(false) }
  }
  return <article className={`pb-message pb-message--${message.role}`} aria-label={message.role === 'user' ? 'You' : 'Pavel-bot'}>
    {message.role === 'assistant' && <div className="pb-avatar" aria-hidden="true"><Icon name="orbit" size={18} /></div>}
    <div className="pb-message-body">
      <span className="pb-message-author">{message.role === 'assistant' ? 'Pavel-bot' : 'You'}</span>
      <div className={`pb-message-text${streaming && message.text ? ' is-writing' : ''}`}>{message.text}</div>
      {message.interrupted && <span className="pb-interrupted">Reply stopped. Refresh to recover the full reply if it finished.</span>}
      {message.role === 'assistant' && message.text && !streaming && <div className="pb-reply-actions">
        <button className="pb-copy" type="button" onClick={copy} aria-label={copied ? 'Reply copied' : 'Copy reply'} title={copied ? 'Copied' : 'Copy reply'}><Icon name={copied ? 'check' : 'copy'} size={15} /><span>{copied ? 'Copied' : 'Copy'}</span></button>
      </div>}
    </div>
  </article>
}

export default function PavelBot({ onBackToMenu }: { onBackToMenu?: () => void }) {
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [showDown, setShowDown] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [overviewOpen, setOverviewOpen] = useState(false)
  const closeOverview = useCallback(() => setOverviewOpen(false), [])
  const conversation = useRef<string | null>(rememberedConversation())
  const abort = useRef<AbortController | null>(null)
  const busyRef = useRef(false)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)
  const retryQuestion = useRef('')
  const mounted = useRef(true)
  const maxChars = session?.max_question_chars || 1200
  const turnLimit = messages.filter(message => message.role === 'user').length >= (session?.max_turns || 20)

  useEffect(() => {
    mounted.current = true
    const previousTitle = document.title
    document.title = 'PAVEL.BOT · Pavel Jermolajev'
    return () => { mounted.current = false; abort.current?.abort(); document.title = previousTitle }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const initialize = async () => {
      setConnecting(true)
      setError('')
      try {
        let data: Session
        try { data = await loadSession(conversation.current, controller.signal) }
        catch (err) {
          if (!(err instanceof ChatApiError) || err.status !== 404) throw err
          conversation.current = null
          remember(null)
          data = await loadSession(null, controller.signal)
        }
        if (controller.signal.aborted) return
        setSession(data)
        setMessages(data.messages)
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to connect. Please try again.')
      } finally { if (!controller.signal.aborted) setConnecting(false) }
    }
    void initialize()
    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    if (!cooldown) return
    const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  useEffect(() => {
    const element = textarea.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(160, element.scrollHeight)}px`
  }, [input])

  useEffect(() => {
    if (atBottom.current && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight
  }, [messages, status, busy])

  const scrollToBottom = () => {
    atBottom.current = true
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  const submit = async (event?: FormEvent) => {
    event?.preventDefault()
    const question = input.trim()
    if (!question || busyRef.current || connecting || !session?.ready || cooldown || turnLimit) return
    busyRef.current = true
    setBusy(true)
    setError('')
    setInput('')
    setStatus('Finding the right details…')
    retryQuestion.current = question
    atBottom.current = true
    setShowDown(false)
    const id = crypto.randomUUID()
    setMessages(previous => [...previous, { id: `${id}-user`, role: 'user', text: question }, { id, role: 'assistant', text: '' }])
    const controller = new AbortController()
    abort.current = controller
    const timer = setTimeout(() => controller.abort('timeout'), 90000)
    const update = (apply: (message: Message) => Message) => {
      if (mounted.current) setMessages(previous => previous.map(message => message.id === id ? apply(message) : message))
    }
    try {
      await sendMessage(question, conversation.current, session.csrf_token, id, controller.signal, (name, data) => {
        if (name === 'meta' && data.conversation_id) {
          conversation.current = data.conversation_id
          remember(data.conversation_id)
        } else if (name === 'status') setStatus(data.message || '')
        else if (name === 'delta') update(message => ({ ...message, text: message.text + (data.text || '') }))
        else if (name === 'done') {
          setAnnouncement('Pavel-bot has replied.')
        }
      })
    } catch (err) {
      if (controller.signal.aborted && controller.signal.reason !== 'timeout') {
        update(message => ({ ...message, interrupted: true }))
        setAnnouncement('Reply stopped.')
      } else {
        setError(err instanceof Error && !controller.signal.aborted ? err.message : 'That took too long. Refresh to recover your reply.')
        update(message => ({ ...message, interrupted: !!message.text }))
        if (err instanceof ChatApiError) setCooldown(err.retryAfter)
      }
    } finally {
      clearTimeout(timer)
      abort.current = null
      busyRef.current = false
      if (mounted.current) { setBusy(false); setStatus(''); textarea.current?.focus({ preventScroll: true }) }
    }
  }

  const startNew = () => {
    if (busyRef.current) return
    remember(null)
    conversation.current = null
    setMessages([])
    setInput('')
    setError('')
    retryQuestion.current = ''
    atBottom.current = true
    textarea.current?.focus({ preventScroll: true })
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submit()
    }
  }
  const pickSuggestion = (question: string) => { setInput(question); textarea.current?.focus({ preventScroll: true }) }
  const disabled = connecting || !session?.ready || !!cooldown || turnLimit
  const hasReply = messages.at(-1)?.role === 'assistant' && !!messages.at(-1)?.text
  const overviewButton = (className: string) => <button className={`pb-build-button ${className}`} type="button"
    aria-haspopup="dialog" aria-controls="pavelbot-build-overview" aria-expanded={overviewOpen}
    onClick={event => { event.currentTarget.focus(); setOverviewOpen(true) }}>
    <span>How I built PAVEL.BOT</span><Icon name="plus" size={16} />
  </button>

  const Page = onBackToMenu ? 'div' : 'main'

  return <Page className={`pb-page${messages.length ? ' has-conversation' : ''}`}>
    <header className="pb-header">
      <a href={onBackToMenu ? '#portfolio-menu' : '/'} className="pb-back" aria-label={onBackToMenu ? 'Back to menu' : 'Back to portfolio'} onClick={event => {
        if (onBackToMenu) { event.preventDefault(); onBackToMenu() }
      }}><Icon name="back" size={16} /><span>{onBackToMenu ? 'Back to menu' : 'Back to portfolio'}</span></a>
      <a href={onBackToMenu ? '#chat' : '/pavel-bot'} className="pb-brand" aria-label="PAVEL.BOT"><span>PAVEL.BOT</span><svg viewBox="0 0 30 30" width="28" height="28" fill="none" aria-hidden="true"><circle cx="15" cy="15" r="11" /><ellipse cx="15" cy="15" rx="5" ry="11" transform="rotate(32 15 15)" /><path d="M4 15h22" /></svg></a>
      <button className="pb-new-chat" onClick={startNew} disabled={busy} type="button"><Icon name="plus" size={17} /><span>New chat</span></button>
    </header>
    <div className="pb-workspace">
      <aside className="pb-sidebar">
        <FoldedField />
        <div className="pb-sidebar-intro"><h1>A conversation<br />beyond the CV.</h1><Introduction />{overviewButton('pb-build-button--sidebar')}</div>
        <div className="pb-sidebar-bottom"><p>Pavel Jermolajev</p><a href="https://www.linkedin.com/in/pavel-jermolajev-767879265/" target="_blank" rel="noopener noreferrer">Say hello on LinkedIn <Icon name="link" size={13} /></a></div>
      </aside>
      <section className="pb-chat" aria-label="Chat with Pavel-bot">
        <div className="pb-mobile-build">{overviewButton('pb-build-button--mobile')}</div>
        <div className="pb-viewport" ref={viewport} onScroll={() => {
          const element = viewport.current
          if (!element) return
          atBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100
          setShowDown(!atBottom.current)
        }}>
          {!messages.length ? <div className="pb-welcome">
            <div className="pb-welcome-mark" aria-hidden="true"><span /><span /><span /></div>
            <h2>Where shall<br />we begin?</h2>
            <p className="pb-welcome-description">A project, a curiosity, a possible collaboration.<br />Take the conversation somewhere.</p>
            <details className="pb-mobile-about"><summary>Meet PAVEL.BOT<Icon name="plus" size={14} /></summary><Introduction /></details>
            <div className="pb-suggestions" aria-label="Suggested questions">{suggestions.map(suggestion => <button key={suggestion.label} type="button" onClick={() => pickSuggestion(suggestion.question)} disabled={busy}>
              <span>{suggestion.label}</span><Icon name="plus" size={14} />
            </button>)}</div>
          </div> : <div className="pb-messages" aria-live="off">
            {messages.map((message, index) => message.text || message.interrupted || message.role === 'user' ? <Reply key={message.id} message={message} streaming={busy && index === messages.length - 1} /> : null)}
            {busy && !hasReply && <div className="pb-thinking" role="status"><div className="pb-avatar"><Icon name="orbit" size={18} /></div><div><span className="pb-thinking-dots" aria-hidden="true"><i /><i /><i /></span><span>{status || 'Putting a reply together…'}</span></div></div>}
          </div>}
        </div>
        {showDown && <button type="button" className="pb-scroll-down" onClick={scrollToBottom} aria-label="Scroll to latest message"><Icon name="down" size={18} /></button>}
        <div className="pb-composer-area">
          {!connecting && !session?.ready && <div className="pb-notice" role="status"><span>Pavel-bot is unavailable at the moment.</span><button onClick={() => setReloadKey(value => value + 1)} type="button">Reconnect</button></div>}
          {turnLimit && <div className="pb-notice" role="status"><span>A good conversation. Ready for a fresh one?</span><button onClick={startNew} type="button" disabled={busy}>Start a new chat</button></div>}
          {error && <div className="pb-error" role="alert"><span>{error}{cooldown > 0 && cooldown < 120 ? ` Try again in ${cooldown}s.` : ''}</span>{retryQuestion.current && !cooldown && <button type="button" disabled={busy} onClick={() => pickSuggestion(retryQuestion.current)}>Edit & retry</button>}</div>}
          <form className={`pb-composer${busy ? ' is-busy' : ''}`} onSubmit={event => { void submit(event) }}>
            <label htmlFor="pavelbot-question" className="pb-sr-only">Ask about Pavel</label>
            <textarea id="pavelbot-question" ref={textarea} value={input} onChange={event => setInput(event.target.value)} onKeyDown={onKeyDown} maxLength={maxChars} rows={1} placeholder={connecting ? 'Opening the conversation…' : busy ? 'Write your next question…' : 'Ask me about Pavel…'} disabled={disabled} aria-describedby="pavelbot-disclaimer" />
            <div className="pb-composer-bottom"><span>{input.length > maxChars * 0.8 ? `${input.length} / ${maxChars}` : ''}</span>
              {busy ? <button className="pb-send pb-stop" type="button" onClick={() => abort.current?.abort()} aria-label="Stop reply" title="Stop reply"><Icon name="stop" size={18} /></button> : <button className="pb-send" type="submit" disabled={disabled || !input.trim()} aria-label="Send message" title="Send message"><Icon name="arrow" size={20} /></button>}
            </div>
          </form>
          <p id="pavelbot-disclaimer" className="pb-disclaimer">AI can make mistakes. Please don’t share personal or sensitive information.<br /><span>Questions and answers are logged for 30 days to improve this assistant.</span></p>
        </div>
      </section>
    </div>
    <div className="pb-sr-only" aria-live="polite" role="status">{announcement}</div>
    <ArchitectureOverview open={overviewOpen} onClose={closeOverview} />
  </Page>
}
