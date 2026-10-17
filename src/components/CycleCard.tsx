import { useState } from 'react'
import { CYCLE_WEEKS, type CycleInfo } from '../engine/periodization'
import { dismissNewCycleNotice, newCycleNotice } from '../state/actions'

/** Barra das 5 semanas do ciclo, com a semana de deload marcada. */
export function CycleBar({ cycle }: { cycle: CycleInfo }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted">
          Ciclo · semana {Math.min(cycle.week, CYCLE_WEEKS)} de {CYCLE_WEEKS}
        </span>
        <span className={cycle.deload ? 'font-bold text-cardio' : 'text-dim'}>{cycle.deload ? 'Deload' : `Deload na semana ${CYCLE_WEEKS}`}</span>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: CYCLE_WEEKS }, (_, i) => {
          const week = i + 1
          const isDeload = week === CYCLE_WEEKS
          const done = week < cycle.week
          const now = week === cycle.week
          return (
            <span
              key={week}
              className={`h-1.5 flex-1 rounded-full ${now ? (isDeload ? 'bg-cardio' : 'bg-lime') : done ? 'bg-lime/45' : isDeload ? 'bg-cardio/25' : 'bg-card2'}`}
            />
          )
        })}
      </div>
    </div>
  )
}

/** Avisos do ciclo em Hoje: semana de deload e ciclo novo com exercícios variados. */
export function CycleNotices({ cycle }: { cycle: CycleInfo }) {
  const [showNew, setShowNew] = useState(newCycleNotice)
  return (
    <>
      {showNew && (
        <div className="card flex flex-col gap-2 border-lime/40">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-[15px] font-medium">Ciclo novo, exercícios novos</h2>
            <button
              type="button"
              aria-label="Dispensar"
              className="cursor-pointer px-1 text-lg text-dim"
              onClick={() => {
                dismissNewCycleNotice()
                setShowNew(false)
              }}
            >
              ×
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Você completou {CYCLE_WEEKS} semanas. O app variou os exercícios para dar um estímulo novo, com as mesmas regras do seu perfil.
          </p>
        </div>
      )}
      {cycle.deload && (
        <div className="card flex flex-col gap-1.5 border-cardio/40">
          <h2 className="font-display text-[15px] font-medium">Semana de deload</h2>
          <p className="text-xs leading-relaxed text-muted">
            Menos séries e cargas 10% mais leves para o corpo recuperar e voltar mais forte no próximo ciclo. Não pule: é parte do plano.
          </p>
        </div>
      )}
    </>
  )
}
