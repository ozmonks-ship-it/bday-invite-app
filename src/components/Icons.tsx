const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth={2.4} aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
)
export const PinIcon = () => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth={2.4} aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.6" /></svg>
)
export const CarIcon = () => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth={2.4} aria-hidden="true"><path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM5 11h14" /><circle cx="7.5" cy="19" r="1.2" /><circle cx="16.5" cy="19" r="1.2" /></svg>
)
export const BusIcon = () => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth={2.4} aria-hidden="true"><rect x="4" y="3" width="16" height="15" rx="3" /><path d="M4 11h16M7 21v-3M17 21v-3" /></svg>
)
export const ExternalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={2.6} aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
)
export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={3} aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
)
export const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" {...base} strokeWidth={3} aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
)
export const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={2.4} style={{ verticalAlign: '-3px' }} aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M5 11v9h14v-9" /></svg>
)
export const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>
