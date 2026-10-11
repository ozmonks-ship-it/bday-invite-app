'use client'
import { plural } from '@/lib/invite'

type Props = { id: string; label: string; value: number; min: number; max: number; one: string; many: string; onChange: (n: number) => void }

export function Stepper({ id, label, value, min, max, one, many, onChange }: Props) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, Number.isFinite(n) ? n : min)))
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="stepper">
        <button type="button" onClick={() => set(value - 1)} disabled={value <= min} aria-label={`One fewer ${one}`}>−</button>
        <input id={id} type="number" inputMode="numeric" min={min} max={max} value={value}
          onChange={(e) => set(parseInt(e.target.value, 10))} aria-describedby={`${id}-now`} />
        <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label={`One more ${one}`}>+</button>
      </div>
      <span id={`${id}-now`} className="sr-only" aria-live="polite">{plural(value, one, many)}</span>
    </div>
  )
}
