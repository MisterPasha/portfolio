import './PavelBotLoading.css'

// Loaded with the portfolio, so the chat's lazy stylesheet is never needed here.
export default function PavelBotLoading() {
  return <div className="pb-loading" role="status" aria-busy="true">
    <div className="pb-loading-content">
      <svg className="pb-loading-field" viewBox="0 0 180 120" fill="none" aria-hidden="true">
        <ellipse cx="90" cy="60" rx="70" ry="25" transform="rotate(-28 90 60)" />
        <ellipse cx="90" cy="60" rx="70" ry="25" transform="rotate(28 90 60)" />
        <ellipse cx="90" cy="60" rx="19" ry="47" />
        <circle cx="90" cy="60" r="3" />
      </svg>
      <p className="pb-loading-name">PAVEL.BOT</p>
      <p className="pb-loading-caption">Opening the conversation…</p>
    </div>
  </div>
}
