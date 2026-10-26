export type ArchitectureNodeId = 'knowledge' | 'ingestion' | 'database' | 'question' | 'search' | 'generation' | 'reply'
export type ArchitectureTone = 'storage' | 'processing' | 'retrieval' | 'generation'

export type ArchitectureNode = {
  id: ArchitectureNodeId
  step: string
  title: string
  caption: string
  role: string
  icon: string
  tone: ArchitectureTone
  operations?: string[]
}

export const preparationNodes: ArchitectureNode[] = [
  { id: 'knowledge', step: '01', title: 'Knowledge files', caption: 'Markdown · Amazon S3',
    role: 'A private collection of structured Markdown holds my experience, projects, skills and professional background.',
    icon: 'cloud', tone: 'storage' },
  { id: 'ingestion', step: '02', title: 'Ingestion pipeline', caption: 'Prepare the knowledge',
    role: 'Documents are parsed, split into chunks, hashed to identify revisions, then embedded for similarity search.',
    icon: 'processor', tone: 'processing', operations: ['Parse', 'Chunk', 'Hash', 'Embed'] },
  { id: 'database', step: '03', title: 'Neon + pgvector', caption: 'Text, vectors & metadata',
    role: 'PostgreSQL stores chunk text, embeddings and metadata. Only explicitly approved revisions can be retrieved.',
    icon: 'database', tone: 'storage' },
]

export const conversationNodes: ArchitectureNode[] = [
  { id: 'question', step: '04', title: 'A visitor asks', caption: 'A natural-language question',
    role: 'A visitor sends a question from React to Django, with conversation context for follow-up questions.',
    icon: 'chat', tone: 'processing' },
  { id: 'search', step: '05', title: 'Semantic search', caption: 'Embed the question · find matches',
    role: 'The question vector is compared with stored vectors in Neon. Matching approved chunks return as text.',
    icon: 'search', tone: 'retrieval' },
  { id: 'generation', step: '06', title: 'Generate an answer', caption: 'Retrieved text · OpenAI',
    role: 'The language model receives retrieved text, the question, limited history and system instructions—not raw vectors.',
    icon: 'brain', tone: 'generation' },
  { id: 'reply', step: '07', title: 'PAVEL.BOT replies', caption: 'Checked · logged · displayed',
    role: 'The answer is screened, saved to a private log, then displayed to the visitor word by word.',
    icon: 'bot', tone: 'processing' },
]

export const architectureNodes = [...preparationNodes, ...conversationNodes]

export const architectureEdges: {
  id: string
  from: ArchitectureNodeId
  to: ArchitectureNodeId
  tone: ArchitectureTone
  bidirectional?: boolean
}[] = [
  { id: 'files-ingestion', from: 'knowledge', to: 'ingestion', tone: 'storage' },
  { id: 'ingestion-database', from: 'ingestion', to: 'database', tone: 'processing' },
  { id: 'question-search', from: 'question', to: 'search', tone: 'processing' },
  { id: 'search-database', from: 'search', to: 'database', tone: 'retrieval', bidirectional: true },
  { id: 'search-generation', from: 'search', to: 'generation', tone: 'retrieval' },
  { id: 'generation-reply', from: 'generation', to: 'reply', tone: 'generation' },
]

export type SafetyFeature = { title: string; description: string; icon: string; tone: ArchitectureTone }

export const safetyFeatures: SafetyFeature[] = [
  { title: 'Public-only Knowledge', description: 'Retrieves only explicitly approved knowledge chunk revisions, keeping unapproved content out of responses.', icon: 'shield-check', tone: 'storage' },
  { title: 'Privacy Screening', description: 'Blocks obvious secret-related requests and screens generated answers for sensitive information before displaying them.', icon: 'shield-search', tone: 'retrieval' },
  { title: 'Abuse Protection', description: 'IP rate limits, concurrency limits and duplicate-request checks reduce misuse and unnecessary processing.', icon: 'activity', tone: 'processing' },
  { title: 'Cost Controls', description: 'Daily and monthly spending caps, along with token limits, help keep API usage predictable and affordable.', icon: 'gauge', tone: 'generation' },
  { title: 'Conversation Protection', description: 'Signed cookies, ownership checks and CSRF protection help keep conversations isolated and requests secure.', icon: 'lock', tone: 'storage' },
  { title: 'Private Logging', description: 'Logs redact obvious sensitive details. A cleanup command supports 30-day retention when scheduled.', icon: 'archive-lock', tone: 'retrieval' },
]
