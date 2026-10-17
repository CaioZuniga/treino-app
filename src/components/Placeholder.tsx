interface Props {
  eyebrow: string
  title: string
  phase: string
  items: string[]
}

// Tela provisória da Fase 0: mostra o que cada tela vai ter e em que fase entra.
export function Placeholder({ eyebrow, title, phase, items }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-1.5 font-display text-[26px] leading-tight font-bold text-balance">{title}</h1>
      </div>
      <div className="card flex flex-col gap-3">
        <span className="chip chip-on self-start">{phase}</span>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-muted">
          {items.map((it) => (
            <li key={it} className="flex gap-2">
              <span className="text-lime" aria-hidden="true">•</span>
              {it}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
