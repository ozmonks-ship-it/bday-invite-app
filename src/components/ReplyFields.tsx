'use client'
import { Stepper } from './Stepper'

export type ReplyDraft = { name: string; attending: boolean; children: number; adults: number; note: string }
export const emptyReply: ReplyDraft = { name: '', attending: true, children: 1, adults: 1, note: '' }

/** Name, coming yes/no, children and adults, note. Shared by guests and hosts. */
export function ReplyFields({ idPrefix, value, onChange, errors, nameHint = 'For example “Leo & family”.' }: {
  idPrefix: string
  value: ReplyDraft
  onChange: (v: ReplyDraft) => void
  errors: Record<string, string>
  nameHint?: string
}) {
  const set = (patch: Partial<ReplyDraft>) => onChange({ ...value, ...patch })
  const nameErr = errors.name
  const countErr = errors.children
  return (
    <>
      <div className="field">
        <label htmlFor={`${idPrefix}-name`}>Your name</label>
        <input id={`${idPrefix}-name`} type="text" autoComplete="name" maxLength={80} value={value.name}
          onChange={(e) => set({ name: e.target.value })}
          aria-invalid={nameErr ? true : undefined} aria-describedby={`${idPrefix}-name-${nameErr ? 'err' : 'hint'}`} />
        {nameErr ? <span className="err" id={`${idPrefix}-name-err`}>{nameErr}</span> : <span className="hint" id={`${idPrefix}-name-hint`}>{nameHint}</span>}
      </div>
      <fieldset>
        <legend>Can you come?</legend>
        <div className="choice">
          <label><input type="radio" name={`${idPrefix}-coming`} checked={value.attending} onChange={() => set({ attending: true })} /> Yes, we’ll be there</label>
          <label><input type="radio" name={`${idPrefix}-coming`} checked={!value.attending} onChange={() => set({ attending: false })} /> Sorry, can’t come</label>
        </div>
      </fieldset>
      {value.attending && (
        <fieldset aria-describedby={countErr ? `${idPrefix}-count-err` : undefined}>
          <legend>Who’s coming?</legend>
          <div className="row2">
            <Stepper id={`${idPrefix}-children`} label="Children" value={value.children} min={0} max={15} one="child" many="children" onChange={(n) => set({ children: n })} />
            <Stepper id={`${idPrefix}-adults`} label="Adults (including you)" value={value.adults} min={0} max={10} one="adult" many="adults" onChange={(n) => set({ adults: n })} />
          </div>
          {countErr && <p className="err" id={`${idPrefix}-count-err`} style={{ margin: '8px 0 0' }}>{countErr}</p>}
        </fieldset>
      )}
      <div className="field">
        <label htmlFor={`${idPrefix}-note`}>Note for the host (optional)</label>
        <textarea id={`${idPrefix}-note`} maxLength={500} value={value.note} onChange={(e) => set({ note: e.target.value })} aria-describedby={`${idPrefix}-note-hint`} />
        <span className="hint" id={`${idPrefix}-note-hint`}>Allergies, siblings, arriving late…</span>
      </div>
    </>
  )
}
