import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export function ScreenHeader({ eyebrow, title, back, right }: { eyebrow?: string; title: string; back?: boolean; right?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-3">
      {(back || right) && (
        <div className="flex items-center justify-between gap-3">
          {back ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-line bg-card2 text-lg text-fg"
            >
              ‹
            </button>
          ) : (
            <span />
          )}
          {right}
        </div>
      )}
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="mt-1.5 font-display text-[26px] leading-tight font-bold text-balance">{title}</h1>
      </div>
    </div>
  )
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <div>
        <h2 className="font-display text-[15px] font-medium">{title}</h2>
        {hint && <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

interface Option<T extends string> {
  value: T
  label: string
  hint?: string
  badge?: string
}

/** Grupo de chips: escolha única por padrão, múltipla com `multiple`. */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  multiple,
  label,
}: {
  options: Option<T>[]
  value: T[]
  onChange: (v: T[]) => void
  multiple?: boolean
  label: string
}) {
  const toggle = (v: T) => {
    if (!multiple) return onChange([v])
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => {
        const on = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o.value)}
            className={`chip cursor-pointer px-3 py-2 text-[13px] ${on ? 'chip-on' : ''}`}
          >
            {o.label}
            {o.badge && <span className="rounded-full bg-lime px-1.5 text-[10px] text-lime-ink">{o.badge}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Lista de cartões para escolha única com descrição. */
export function ChoiceCards<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 text-left ${
              on ? 'border-lime/45 bg-lime/10' : 'border-line bg-card'
            }`}
          >
            <span>
              <span className="flex items-center gap-2 text-sm font-bold">
                {o.label}
                {o.badge && <span className="rounded-full bg-lime px-1.5 py-px text-[10px] text-lime-ink">{o.badge}</span>}
              </span>
              {o.hint && <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>}
            </span>
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? 'border-lime bg-lime' : 'border-line'}`}
              aria-hidden="true"
            >
              {on && <span className="h-2 w-2 rounded-full bg-lime-ink" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function Stepper({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  unit?: string
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-3">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Diminuir ${label}`}
          onClick={() => onChange(clamp(value - step))}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-line bg-card2 text-lg"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (!Number.isNaN(v)) onChange(v)
          }}
          onBlur={() => onChange(clamp(value))}
          className="w-16 rounded-xl border border-line bg-card2 py-2 text-center font-mono text-base text-fg"
        />
        <button
          type="button"
          aria-label={`Aumentar ${label}`}
          onClick={() => onChange(clamp(value + step))}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-line bg-card2 text-lg"
        >
          +
        </button>
        {unit && <span className="w-7 text-xs text-muted">{unit}</span>}
      </div>
    </div>
  )
}

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  onBlur,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onBlur?: () => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="rounded-2xl border border-line bg-card px-4 py-3 text-base text-fg placeholder:text-dim"
      />
    </div>
  )
}

export function Dot({ color }: { color: 'lime' | 'mob' | 'cardio' }) {
  const bg = { lime: 'bg-lime', mob: 'bg-mob', cardio: 'bg-cardio' }[color]
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${bg}`} aria-hidden="true" />
}

export function Loading() {
  return <div className="py-16 text-center text-sm text-muted">Carregando…</div>
}
