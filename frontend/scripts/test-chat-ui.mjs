// Dependency-free Chrome smoke test. Start Vite first, then:
// node scripts/test-chat-ui.mjs http://localhost:5173
// API responses are intercepted; no paid API/database calls are made.
// Portfolio WebGL decorations are stubbed to keep headless checks independent
// of graphics drivers. The menu, layout, loader, chat, and architecture stay real.
// Font CDN stylesheets are stubbed too, exercising the declared font fallbacks
// without making test startup depend on external network availability.
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import assert from 'node:assert/strict'

const origin = process.argv[2] || 'http://localhost:5173'
const chromePath = process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(existsSync)
if (!chromePath) throw new Error('Set CHROME_PATH to your Chrome executable.')
const profile = await mkdtemp(join(tmpdir(), 'pavelbot-ui-'))
const chrome = spawn(chromePath, ['--headless=new', '--no-first-run',
  '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
{ windowsHide: true, stdio: 'ignore' })
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
let socket
const outstanding = new Map()
let nextId = 0
let sessionId
let mode = 'ready'
let holdChatModule = true
const heldChatModules = []
let replyGate = null
const decorations = /\/(GradientWaves|GradientASCII|Particles)\.[jt]sx$/
const sent = []
const conversationId = '7cf7aa69-9919-4861-b061-671ea0fc9cdd'
const sources = [{ document_id: 'project-hi5', chunk_index: 0, title: 'Hi5 Social Platform', section: 'Contributions', links: [{ label: 'repository', url: 'https://github.com/MisterPasha' }] }]
let runtimeErrors = []
const pendingRequests = new Map()

function command(method, params = {}, session = sessionId) {
  const id = ++nextId
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { outstanding.delete(id); reject(new Error(`Timed out: ${method} ${params.expression?.slice(0, 160) || ''}`)) }, 30000)
    outstanding.set(id, { resolve: value => { clearTimeout(timer); resolve(value) }, reject: error => { clearTimeout(timer); reject(error) } })
    socket.send(JSON.stringify({ id, method, params, ...(session ? { sessionId: session } : {}) }))
  })
}

async function fulfill(requestId, status, body, headers = {}) {
  await command('Fetch.fulfillRequest', { requestId, responseCode: status,
    responseHeaders: Object.entries({ 'Content-Type': 'application/json', ...headers }).map(([name, value]) => ({ name, value })),
    body: Buffer.from(body).toString('base64') })
}

async function intercept(params) {
  const { requestId, request } = params
  if (new URL(request.url).hostname === 'fonts.googleapis.com') {
    await fulfill(requestId, 200, '', { 'Content-Type': 'text/css' })
    return
  }
  if (decorations.test(new URL(request.url).pathname)) {
    await fulfill(requestId, 200, 'export default function Decoration() { return null }', { 'Content-Type': 'application/javascript' })
    return
  }
  if (new URL(request.url).pathname.endsWith('/components/chat/PavelBot.tsx')) {
    if (holdChatModule) heldChatModules.push(requestId)
    else await command('Fetch.continueRequest', { requestId })
    return
  }
  if (!new URL(request.url).pathname.startsWith('/api/chat/')) {
    await command('Fetch.continueRequest', { requestId })
    return
  }
  if (request.url.includes('/api/chat/session/')) {
    const messages = mode === 'restore' ? sent.slice(0, 2).flatMap((turn, index) => [
      { id: `${index}-user`, role: 'user', text: turn.question },
      { id: `${index}-assistant`, role: 'assistant', text: index === 0 ? 'Pavel contributed to Hi5, a social platform built with his team.' : 'He also worked on the backend and deployment.' },
    ]) : []
    await fulfill(requestId, 200, JSON.stringify({ csrf_token: 'test', ready: mode !== 'offline', messages, max_question_chars: 1200, max_turns: 20 }))
  } else {
    const body = JSON.parse(request.postData)
    sent.push(body)
    if (mode === 'rate') return fulfill(requestId, 429, JSON.stringify({ error: 'A few too many messages. Please wait a little.' }), { 'Retry-After': '60' })
    const answer = sent.length === 1 ? 'Pavel contributed to Hi5, a social platform built with his team.' : 'He also worked on the backend and deployment.'
    const frame = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    const data = frame('meta', { conversation_id: conversationId }) + frame('status', { message: 'Looking through Pavel’s work…' })
      + answer.split(/(?<=\s)/).map(text => frame('delta', { text })).join('') + frame('done', { sources })
    await replyGate
    await delay(mode === 'slow' ? 2000 : 350)
    await fulfill(requestId, 200, data, { 'Content-Type': 'text/event-stream' }).catch(() => {})
  }
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}
async function waitFor(expression, label, timeout = 10000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return
    await delay(60)
  }
  const diagnostics = await evaluate("({url:location.href, state:document.readyState, scrollY, chatTop:document.getElementById('chat')?.getBoundingClientRect().top, body:document.body.innerText.slice(0,1200)})")
  const capture = await screenshot('pavelbot-check-failure.png')
  throw new Error(`UI check timed out: ${label}. ${JSON.stringify({ ...diagnostics, runtimeErrors, pendingRequests: [...pendingRequests.values()], capture })}`)
}
async function input(text) {
  await evaluate(`(() => { const el=document.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,${JSON.stringify(text)}); el.dispatchEvent(new Event('input',{bubbles:true})); })()`)
}
async function key(key, modifiers = 0) {
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, modifiers,
    windowsVirtualKeyCode: key === 'Tab' ? 9 : key === 'Escape' ? 27 : 13 })
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, modifiers })
}
async function screenshot(name) {
  const result = await command('Page.captureScreenshot', { format: 'png' })
  const path = join(tmpdir(), name)
  await writeFile(path, Buffer.from(result.data, 'base64'))
  return path
}

try {
  let port
  for (let i = 0; i < 150; i++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { await delay(100) }
  }
  if (!port) throw new Error('Chrome did not start.')
  const version = await fetch(`http://127.0.0.1:${port}/json/version`).then(response => response.json())
  socket = new WebSocket(version.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id) {
      const pending = outstanding.get(message.id)
      outstanding.delete(message.id)
      if (pending) message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result)
    } else if (message.method === 'Fetch.requestPaused') {
      void intercept(message.params).catch(error => {
        // StrictMode, Stop, and navigation can cancel a request before fulfillment.
        if (error.message !== 'Invalid InterceptionId.') runtimeErrors.push(error.message)
      })
    } else if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text)
    else if (message.method === 'Network.requestWillBeSent') pendingRequests.set(message.params.requestId, message.params.request.url)
    else if (message.method === 'Network.loadingFinished' || message.method === 'Network.loadingFailed') pendingRequests.delete(message.params.requestId)
  })
  const { targetId } = await command('Target.createTarget', { url: 'about:blank' }, null)
  sessionId = (await command('Target.attachToTarget', { targetId, flatten: true }, null)).sessionId
  await command('Page.enable')
  await command('Runtime.enable')
  await command('Network.enable')
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await command('Fetch.enable', { patterns: [
    { urlPattern: '*/api/chat/*' }, { urlPattern: '*/src/components/chat/PavelBot.tsx*' },
    { urlPattern: 'https://fonts.googleapis.com/*' },
    ...['GradientWaves', 'GradientASCII', 'Particles'].map(name => ({ urlPattern: `*/src/components/${name}.jsx*` })),
  ] })
  await command('Page.navigate', { url: `${origin}/` })
  await waitFor("!!document.querySelector('.constellation-menu')", 'portfolio menu', 30000)
  const chatButton = "[...document.querySelectorAll('.constellation-node')].find(button => button.textContent.includes('PAVEL.BOT'))"
  assert.equal(await evaluate(`!!${chatButton}`), true)
  await evaluate("window.__samePortfolio = true; document.getElementById('portfolio-menu').scrollIntoView()")
  const menuPosition = await evaluate('scrollY')
  await evaluate(`${chatButton}.click()`)
  await waitFor("!!document.querySelector('#chat .pb-loading')", 'inline loading screen')
  assert.equal(await evaluate('location.pathname'), '/')
  assert.equal(await evaluate('window.__samePortfolio'), true)
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.pb-loading')).backgroundColor"), 'rgb(25, 27, 34)')
  assert.equal(await evaluate("document.querySelector('#chat').getBoundingClientRect().height === innerHeight"), true)
  await waitFor(`scrollY > ${menuPosition} + 5`, 'chat opens with downward scroll')
  await waitFor("Math.abs(document.getElementById('chat').getBoundingClientRect().top) < 2", 'animated scroll to chat')
  const loading = await screenshot('pavelbot-loading.png')
  assert.ok(heldChatModules.length, 'Chat module is held to verify real lazy loading')
  holdChatModule = false
  await Promise.all(heldChatModules.splice(0).map(requestId => command('Fetch.continueRequest', { requestId })))
  await waitFor("document.querySelector('textarea') && !document.querySelector('textarea').disabled", 'inline chat ready', 30000)
  assert.equal(await evaluate("Math.abs(document.getElementById('chat').getBoundingClientRect().top) < 2"), true)
  assert.equal(await evaluate("document.querySelectorAll('main').length"), 1)
  const embedded = await screenshot('pavelbot-embedded.png')
  await input('Keep this draft when returning to the menu')
  await evaluate("document.querySelector('.pb-build-button--sidebar').click()")
  await waitFor("document.querySelector('.pa-overview').open", 'embedded architecture overlay')
  await key('Escape')
  await waitFor("!document.querySelector('.pa-overview').open", 'embedded architecture close')
  assert.equal(await evaluate("Math.abs(document.getElementById('chat').getBoundingClientRect().top) < 2"), true)
  await evaluate("document.querySelector('.pb-back').click()")
  await waitFor("Math.abs(document.getElementById('portfolio-menu').getBoundingClientRect().top) < 2", 'animated return to menu')
  assert.equal(await evaluate('location.pathname'), '/')
  assert.equal(await evaluate("document.querySelector('textarea').value"), 'Keep this draft when returning to the menu')
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await evaluate(`${chatButton}.click()`)
  await waitFor("Math.abs(document.getElementById('chat').getBoundingClientRect().top) < 2", 'reduced-motion inline navigation')
  assert.equal(await evaluate("document.querySelector('textarea').value"), 'Keep this draft when returning to the menu')
  await evaluate("document.querySelector('.pb-back').click()")
  await waitFor("Math.abs(document.getElementById('portfolio-menu').getBoundingClientRect().top) < 2", 'reduced-motion return to menu')
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await evaluate(`${chatButton}.click()`)
  await waitFor("Math.abs(document.getElementById('chat').getBoundingClientRect().top) < 2", 'mobile inline navigation')
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
  assert.equal(await evaluate("document.querySelector('.pb-composer').getBoundingClientRect().bottom < innerHeight"), true)
  await evaluate("document.querySelector('.pb-back').click()")
  await waitFor("Math.abs(document.getElementById('portfolio-menu').getBoundingClientRect().top) < 2", 'mobile return to menu')
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await evaluate("[...document.querySelectorAll('.constellation-node')].find(button => button.textContent.includes('Contact Me')).click()")
  await waitFor("!!document.getElementById('contact') && !document.getElementById('chat')", 'other menu sections still open')
  assert.equal(await evaluate('location.pathname'), '/')
  await command('Emulation.setEmulatedMedia', { features: [] })
  // A direct link retains its standalone layout and uses the same loading screen.
  holdChatModule = true
  await command('Network.setCacheDisabled', { cacheDisabled: true })
  await command('Page.navigate', { url: `${origin}/pavel-bot` })
  await waitFor("!!document.querySelector('.pb-loading')", 'standalone loading screen')
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.pb-loading')).backgroundColor"), 'rgb(25, 27, 34)')
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.pb-loading-field')).animationName"), 'none')
  await command('Emulation.setEmulatedMedia', { features: [] })
  holdChatModule = false
  await Promise.all(heldChatModules.splice(0).map(requestId => command('Fetch.continueRequest', { requestId })))
  await waitFor("document.querySelector('textarea') && !document.querySelector('textarea').disabled", 'ready state')
  assert.equal(await evaluate("document.querySelectorAll('.pb-suggestions button').length"), 4)
  const removedCopy = ['Your portfolio companion', 'ASK. EXPLORE. CONNECT.', 'A DIFFERENT WAY TO EXPLORE',
    'Behind the projects.', 'Beyond the CV.', 'Code, data & curious ideas.', 'Enter to send', 'Shift + Enter for a new line']
  for (const text of removedCopy) assert.equal(await evaluate(`document.body.textContent.includes(${JSON.stringify(text)})`), false)
  assert.match(await evaluate("document.querySelector('.pb-sidebar .pb-introduction').textContent"), /Retrieval-Augmented Generation/)
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
  const aside = await evaluate("(() => { const r=document.querySelector('.pb-sidebar').getBoundingClientRect(); return {x:r.left+25,y:r.top+50}; })()")
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: aside.x, y: aside.y })
  await waitFor("!!document.querySelector('.pb-field').style.getPropertyValue('--field-y') && document.querySelector('.pb-field').style.getPropertyValue('--field-y') !== '0deg'", 'pointer-responsive field')
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 15, y: 15 })
  await delay(800)
  await evaluate("Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 2500))]).then(() => true)")
  const desktop = await screenshot('pavelbot-desktop.png')
  await command('Emulation.setDeviceMetricsOverride', { width: 820, height: 650, deviceScaleFactor: 1, mobile: false })
  await delay(200)
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
  assert.equal(await evaluate("document.querySelector('.pb-composer').getBoundingClientRect().bottom < innerHeight"), true)
  assert.equal(await evaluate("document.querySelector('.pb-sidebar h1').scrollWidth <= document.querySelector('.pb-sidebar h1').clientWidth"), true)
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await input('Keep this question while I explore')
  await evaluate("document.querySelector('.pb-build-button--sidebar').click()")
  await waitFor("document.querySelector('.pa-overview').open && [...document.querySelectorAll('.pa-wire')].every(path => path.getAttribute('d'))", 'architecture modal and connections')
  assert.equal(await evaluate("document.querySelectorAll('.pa-node').length"), 7)
  assert.equal(await evaluate("document.querySelectorAll('.pa-safety-card').length"), 6)
  assert.equal(await evaluate("document.activeElement.classList.contains('pa-close')"), true)
  assert.match(await evaluate("getComputedStyle(document.querySelector('.pa-overview'), '::backdrop').backdropFilter"), /blur/)
  assert.equal(await evaluate("document.body.style.overflow"), 'hidden')
  assert.equal(await evaluate("document.querySelector('.pa-body').scrollWidth <= document.querySelector('.pa-body').clientWidth"), true)
  await delay(350)
  const architectureDesktop = await screenshot('pavelbot-architecture-desktop.png')
  await evaluate("document.querySelector('[data-node=knowledge]').click()")
  assert.match(await evaluate("document.querySelector('.pa-node-detail').textContent"), /private collection/)
  assert.equal(await evaluate("document.querySelector('[data-edge=files-ingestion]').dataset.active"), 'true')
  await evaluate("document.querySelector('.pa-close').focus()")
  await key('Tab', 8)
  assert.equal(await evaluate("document.activeElement.dataset.node"), 'reply')
  await key('Tab')
  assert.equal(await evaluate("document.activeElement.classList.contains('pa-close')"), true)
  await key('Escape')
  await waitFor("!document.querySelector('.pa-overview').open", 'Escape closes architecture')
  assert.equal(await evaluate("document.activeElement.classList.contains('pb-build-button--sidebar')"), true)
  assert.equal(await evaluate("document.querySelector('textarea').value"), 'Keep this question while I explore')
  assert.notEqual(await evaluate("document.body.style.overflow"), 'hidden')
  await evaluate("document.querySelector('.pb-build-button--sidebar').click()")
  await waitFor("document.querySelector('.pa-overview').open", 'reopen architecture')
  await delay(300)
  await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: 4, y: 4, button: 'left', clickCount: 1 })
  await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 4, y: 4, button: 'left', clickCount: 1 })
  await waitFor("!document.querySelector('.pa-overview').open", 'backdrop closes architecture')
  await input('')
  await evaluate("document.querySelectorAll('.pb-suggestions button')[1].click()")
  assert.match(await evaluate("document.querySelector('textarea').value"), /Hi5/)
  let resumeReply
  replyGate = new Promise(resolve => { resumeReply = resolve })
  await evaluate("document.querySelector('[aria-label=\"Send message\"]').click()")
  await waitFor("!!document.querySelector('.pb-thinking')", 'loading animation')
  resumeReply()
  replyGate = null
  await waitFor("!!document.querySelector('.pb-copy')", 'completed reply')
  assert.equal(await evaluate("document.querySelectorAll('.pb-sources').length"), 0)
  assert.equal(await evaluate("document.body.textContent.includes('Hi5 Social Platform')"), false)
  assert.match(await evaluate("document.querySelector('.pb-message--assistant').textContent"), /Hi5/)
  await delay(250)
  const conversation = await screenshot('pavelbot-conversation.png')
  await input('What else did he work on?')
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await waitFor("document.querySelectorAll('.pb-copy').length === 2", 'follow-up reply using Enter')
  assert.equal(sent[1].conversation_id, conversationId)
  assert.equal(Object.hasOwn(sent[1], 'history'), false)
  mode = 'restore'
  await command('Page.reload')
  await waitFor("document.querySelectorAll('.pb-copy').length === 2", 'conversation restored after refresh')
  assert.match(await evaluate("document.querySelector('.pb-messages').textContent"), /What else did he work on/)
  mode = 'ready'
  await evaluate("document.querySelector('.pb-new-chat').click()")
  await waitFor("!!document.querySelector('.pb-welcome')", 'new chat')
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await delay(300)
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
  assert.equal(await evaluate("document.querySelector('.pb-composer').getBoundingClientRect().bottom < innerHeight"), true)
  const mobile = await screenshot('pavelbot-mobile.png')
  await evaluate("document.querySelector('.pb-build-button--mobile').click()")
  await waitFor("document.querySelector('.pa-overview').open", 'mobile architecture')
  await delay(350)
  assert.equal(await evaluate("document.querySelector('.pa-body').scrollWidth <= document.querySelector('.pa-body').clientWidth"), true)
  const architectureMobile = await screenshot('pavelbot-architecture-mobile.png')
  await evaluate("document.querySelector('[data-node=search]').scrollIntoView({block:'center'}); document.querySelector('[data-node=search]').click()")
  assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-node=search] .pa-node-mobile-role')).display"), 'block')
  assert.equal(await evaluate("document.querySelectorAll('[data-edge=search-database] .pa-wire[marker-start]').length"), 1)
  await command('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true })
  await delay(200)
  await evaluate("document.querySelector('[data-node=generation]').scrollIntoView({block:'center'}); document.querySelector('[data-node=generation]').click()")
  assert.equal(await evaluate("document.querySelector('.pa-body').scrollWidth <= document.querySelector('.pa-body').clientWidth"), true)
  assert.equal(await evaluate("document.querySelector('[data-node=generation]').scrollHeight <= document.querySelector('[data-node=generation]').clientHeight"), true)
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await evaluate("document.querySelector('.pa-close').click()")
  await waitFor("!document.querySelector('.pa-overview').open", 'close button')
  assert.equal(await evaluate("document.activeElement.classList.contains('pb-build-button--mobile')"), true)
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await evaluate("document.querySelector('.pb-build-button--mobile').click()")
  await waitFor("document.querySelector('.pa-overview').open", 'reduced-motion architecture')
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.pa-overview')).animationName"), 'none')
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.pb-field')).transform"), 'none')
  await key('Escape')
  await waitFor("!document.querySelector('.pa-overview').open", 'reduced-motion close')
  await command('Emulation.setEmulatedMedia', { features: [] })
  await evaluate("document.querySelector('.pb-mobile-about summary').click()")
  assert.equal(await evaluate("document.querySelector('.pb-mobile-about').open"), true)
  assert.match(await evaluate("document.querySelector('.pb-mobile-about').textContent"), /person behind the CV/)
  await evaluate("document.querySelector('.pb-mobile-about summary').click()")
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 430, deviceScaleFactor: 1, mobile: true })
  assert.equal(await evaluate("document.querySelector('.pb-composer').getBoundingClientRect().bottom <= innerHeight"), true)
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  mode = 'slow'
  await input('Tell me more about data engineering')
  await evaluate("document.querySelector('[aria-label=\"Send message\"]').click()")
  await waitFor("!!document.querySelector('[aria-label=\"Stop reply\"]')", 'stop button')
  await evaluate("document.querySelector('[aria-label=\"Stop reply\"]').click()")
  await waitFor("!!document.querySelector('.pb-interrupted')", 'stopped state')
  await evaluate("document.querySelector('.pb-new-chat').click()")
  mode = 'rate'
  await input('Tell me more about AWS')
  await evaluate("document.querySelector('[aria-label=\"Send message\"]').click()")
  await waitFor("!!document.querySelector('.pb-error')", 'rate limit message')
  assert.equal(await evaluate("document.querySelector('[aria-label=\"Send message\"]').disabled"), true)
  mode = 'offline'
  await command('Page.reload')
  await waitFor("!!document.querySelector('.pb-notice')", 'offline state')
  assert.equal(await evaluate("document.querySelector('textarea').disabled"), true)
  assert.deepEqual(runtimeErrors, [])
  console.log(JSON.stringify({ passed: ['inline menu navigation', 'animated section scroll', 'matching lazy loader', 'standalone direct link', 'return to menu with draft intact', 'reduced-motion navigation', 'other menu sections', 'desktop/tablet/mobile layout', 'pointer-responsive field', 'updated copy', 'mobile introduction', 'architecture diagram', 'node selection', 'blurred backdrop', 'focus trapping/restoration', 'Escape/backdrop/close button', 'draft preservation', '320px layout', 'reduced motion', 'suggestions', 'loading', 'SSE display', 'no source lists', 'keyboard submission', 'follow-up identity', 'history recovery', 'new chat', 'stop', 'rate limiting', 'offline state'], screenshots: { loading, embedded, desktop, conversation, mobile, architectureDesktop, architectureMobile } }, null, 2))
} finally {
  if (socket?.readyState === WebSocket.OPEN) await command('Browser.close', {}, null).catch(() => {})
  socket?.close()
  chrome.kill()
  await delay(300)
  const resolvedProfile = resolve(profile)
  if (dirname(resolvedProfile) === resolve(tmpdir()) && basename(resolvedProfile).startsWith('pavelbot-ui-')) {
    await rm(resolvedProfile, { recursive: true, force: true, maxRetries: 4 }).catch(() => {})
  }
}
