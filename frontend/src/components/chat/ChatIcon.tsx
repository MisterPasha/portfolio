import type { ReactNode } from 'react'

export default function ChatIcon({ name, size = 20 }: { name: string; size?: number }) {
  const shield = <path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6Z" />
  const paths: Record<string, ReactNode> = {
    arrow: <path d="m5 12 7-7 7 7M12 5v14" />,
    back: <path d="m12 5-7 7 7 7M5 12h15" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5Z" /></>,
    bot: <path d="M12 3v3M10 3h4M4 9l3-3h10l3 3v9H4ZM1 11v4m22-4v4M8 21h8M8 14v-3m8 3v-3" />,
    code: <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" />,
    orbit: <><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-35 12 12)" /></>,
    layers: <path d="m12 3 10 5-10 5L2 8Zm-9 9 9 5 9-5M3 16l9 5 9-5" />,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    link: <path d="M14 4h6v6M20 4l-9 9M10 4H4v16h16v-6" />,
    down: <path d="m6 13 6 6 6-6M12 5v14" />,
    cloud: <><path d="M7 18a5 5 0 0 1-1-9.9A7 7 0 0 1 19.7 10 4 4 0 0 1 19 18Z" /><path d="M9 14h6M9 17h4" /></>,
    processor: <><rect x="6" y="6" width="12" height="12" rx="1" /><path d="M9 9h6v6H9ZM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4M18 9h4m-4 6h4" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0" /></>,
    chat: <path d="M4 4h16v13H9l-5 4ZM8 8h8M8 12h5" />,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6M7 10h6M10 7v6" /></>,
    brain: <><path d="M12 5a4 4 0 0 0-7 2 4 4 0 0 0-2 7 4 4 0 0 0 5 6 3 3 0 0 0 4-1V5Zm0 0a4 4 0 0 1 7 2 4 4 0 0 1 2 7 4 4 0 0 1-5 6 3 3 0 0 1-4-1M5 7l3 2m-5 5 4-1m12-6-3 2m5 5-4-1" /></>,
    'shield-check': <>{shield}<path d="m8 11 3 3 5-5" /></>,
    'shield-search': <>{shield}<circle cx="11" cy="11" r="3" /><path d="m13.5 13.5 3 3" /></>,
    activity: <><path d="M3 18V5h18M3 13h4l3-6 4 10 3-6h4" /></>,
    gauge: <><path d="M4 18a10 10 0 1 1 16 0ZM12 4v2M5 8l2 2m12-2-2 2M12 14l4-5" /><circle cx="12" cy="14" r="1" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="1" /><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" /></>,
    'archive-lock': <><path d="M13 21H4V3h16v7M7 7h10M7 11h4M7 15h3" /><rect x="13" y="15" width="9" height="7" rx="1" /><path d="M15 15v-2a2.5 2.5 0 0 1 5 0v2" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.spark}</svg>
}
