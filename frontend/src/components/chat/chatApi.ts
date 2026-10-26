export type Message = { id: string; role: 'user' | 'assistant'; text: string; interrupted?: boolean }
export type Session = { csrf_token: string; ready: boolean; messages: Message[]; max_question_chars: number; max_turns: number }

export class ChatApiError extends Error {
  retryAfter: number
  status: number
  constructor(message: string, status: number, retryAfter = 0) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

async function check(response: Response) {
  if (response.ok) return
  const body = await response.json().catch(() => null)
  throw new ChatApiError(body?.error || (response.status === 403 ? 'Your session needs a refresh. Please reload the page.' : 'Pavel-bot couldn’t connect. Please try again shortly.'), response.status,
    Math.min(3600, Number(response.headers.get('Retry-After')) || 0))
}

export async function loadSession(conversationId: string | null, signal: AbortSignal): Promise<Session> {
  const query = conversationId ? `?conversation_id=${encodeURIComponent(conversationId)}` : ''
  const response = await fetch(`/api/chat/session/${query}`, {
    credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
  })
  await check(response)
  return response.json()
}

type StreamEvent = { conversation_id?: string; text?: string; message?: string }

export async function sendMessage(question: string, conversationId: string | null, csrfToken: string,
  requestId: string, signal: AbortSignal, onEvent: (name: string, data: StreamEvent) => void) {
  const response = await fetch('/api/chat/message/', {
    method: 'POST', credentials: 'same-origin', signal,
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
    body: JSON.stringify({ question, conversation_id: conversationId, request_id: requestId }),
  })
  await check(response)
  if (!response.body || !response.headers.get('Content-Type')?.includes('text/event-stream')) throw new Error('The connection was interrupted. Please try again.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let complete = false
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      let boundary: number
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const name = frame.split('\n').find(line => line.startsWith('event: '))?.slice(7)
        const data = frame.split('\n').filter(line => line.startsWith('data: ')).map(line => line.slice(6)).join('\n')
        if (!name || !data) continue
        const parsed = JSON.parse(data) as StreamEvent
        if (name === 'error') throw new Error(parsed.message || 'That reply couldn’t be completed.')
        if (name === 'done') complete = true
        onEvent(name, parsed)
      }
      if (done) break
    }
    if (!complete) throw new Error('The connection was interrupted. Refresh to recover your reply.')
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
