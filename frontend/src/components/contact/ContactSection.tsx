import { useEffect, useRef, useState } from 'react'
import GridScan from '@/components/GridScan'
import './ContactSection.css'

const email = 'pavel.jermolajev99@gmail.com'

function copyWithSelection() {
  const previousFocus = document.activeElement as HTMLElement | null
  const field = document.createElement('textarea')
  field.value = email
  field.setAttribute('readonly', '')
  field.setAttribute('aria-hidden', 'true')
  Object.assign(field.style, { position: 'fixed', left: '-9999px', top: '0', fontSize: '16px' })
  document.body.appendChild(field)
  try {
    field.focus({ preventScroll: true })
    field.select()
    return document.execCommand('copy')
  } finally {
    field.remove()
    previousFocus?.focus({ preventScroll: true })
  }
}

export default function ContactSection() {
  const [notification, setNotification] = useState<string | null>(null)
  const notificationTimer = useRef<number | null>(null)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (notificationTimer.current !== null) window.clearTimeout(notificationTimer.current)
    }
  }, [])

  const copyEmail = async () => {
    let copied = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email)
        copied = true
      } else copied = copyWithSelection()
    } catch {
      try { copied = copyWithSelection() } catch { copied = false }
    }
    if (!mounted.current) return
    if (notificationTimer.current !== null) window.clearTimeout(notificationTimer.current)
    setNotification(copied ? 'email copied' : 'Could not copy email. Please try again.')
    notificationTimer.current = window.setTimeout(() => setNotification(null), 3000)
  }

  return (
    <section className="contact-section" id="contact" aria-labelledby="contact-heading">
      <div className="contact-background" aria-hidden="true">
        <GridScan
          linesColor="#4d4757"
          scanColor="#d24e24"
          cells={8}
          depth={3}
          scanDuration={2.4}
          scanDelay={1.6}
          clickEffect="ping"
          reflection={0.55}
          points={false}
          scanWidth={0.6}
          trail={0.3}
          glow={0.5}
        />
      </div>
      <div className="contact-content">
        <p className="contact-kicker">PAVEL / CONTACT</p>
        <h2 id="contact-heading">Contact <span>Me</span></h2>
        <div className="contact-links" role="group" aria-label="Contact and social profiles">
          <a className="contact-link" href="https://www.linkedin.com/in/pavel-jermolajev-767879265/" target="_blank" rel="noreferrer" aria-label="Pavel on LinkedIn (opens in a new tab)">
            <span className="contact-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="2" y="2" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path fill="currentColor" d="M6 9h3v10H6V9Zm1.5-4a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5ZM11 9h2.9v1.4c.6-1 1.5-1.7 3-1.7 3 0 3.6 2 3.6 4.6V19h-3v-5c0-1.2 0-2.7-1.7-2.7s-2 1.3-2 2.6V19H11V9Z" />
              </svg>
            </span>
          </a>
          <button className="contact-link" type="button" onClick={copyEmail} aria-label="Copy email address">
            <span className="contact-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m3 5 9 7 9-7" />
              </svg>
            </span>
          </button>
          <a className="contact-link" href="https://github.com/MisterPasha" target="_blank" rel="noreferrer" aria-label="Pavel on GitHub (opens in a new tab)">
            <span className="contact-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
                <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.39.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.6c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
              </svg>
            </span>
          </a>
        </div>
        <p className="contact-location">Brighton, UK</p>
        <p className="contact-opportunities">Open to On-Site, Hybrid, and Remote opportunities</p>
      </div>
      <div className="contact-notification" role="status" aria-live="polite" aria-atomic="true">
        {notification && <span>{notification}</span>}
      </div>
    </section>
  )
}
