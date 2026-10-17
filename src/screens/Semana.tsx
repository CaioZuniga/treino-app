import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Dot, Loading, ScreenHeader } from '../components/ui'
import { SPLIT_LABELS, weekSchedule } from '../engine'
import { regenerate } from '../state/actions'
import { useProfile, useProgram } from '../state/hooks'

const CARDIO_LABEL = { hiit: 'HIIT', liss: 'Aeróbico leve', circuito: 'Circuito' } as const

export function Semana() {
  const profile = useProfile()
  const program = useProgram()
  const [busy, setBusy] = useState(false)
  if (!profile || !program) return <Loading />

  const order = weekSchedule(program, profile.daysPerWeek)
  const byKey = new Map(program.sessions.map((s) => [s.key, s]))

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader eyebrow={`${SPLIT_LABELS[program.split]} · ${profile.daysPerWeek} dias`} title="Sua semana" />

      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {order.map((key, i) => {
          const s = byKey.get(key)!
          return (
            <li key={`${key}-${i}`}>
              <Link to={`/treino/${key}`} className="card flex items-center gap-3.5 p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-card2 font-display text-lg text-lime">{key}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted">Dia {i + 1}</div>
                  <div className="text-[15px] font-bold">{s.title}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <Dot color="lime" /> {s.strength.length} exercícios
                    </span>
                    {s.cardio && (
                      <span className="flex items-center gap-1.5">
                        <Dot color="cardio" /> {CARDIO_LABEL[s.cardio.kind]}
                      </span>
                    )}
                    <span className="font-mono">{s.estimatedMinutes} min</span>
                  </div>
                </div>
                <span className="text-dim" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          )
        })}
      </ol>

      <div className="card flex flex-col gap-3">
        <h2 className="font-display text-[15px] font-medium">Quer variar?</h2>
        <p className="text-xs leading-relaxed text-muted">
          Gera uma nova combinação de exercícios com as mesmas regras. Bom para trocar o estímulo a cada 4 a 6 semanas.
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await regenerate({ newVariation: true })
            setBusy(false)
          }}
        >
          {busy ? 'Gerando…' : 'Gerar variação'}
        </button>
      </div>
    </div>
  )
}
