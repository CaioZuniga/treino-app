import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExerciseRow } from '../components/ExerciseRow'
import { Dot, Loading, ScreenHeader } from '../components/ui'
import { EXERCISES, exerciseName } from '../data/catalog'
import { GOAL_LABELS } from '../data/labels'
import { alternatives, SPLIT_LABELS } from '../engine'
import { blockMinutes } from '../engine/session'
import { swapExercise } from '../state/actions'
import { useEnvironment, useLive, useProfile, useProgram } from '../state/hooks'

const CARDIO_TITLE = { hiit: 'HIIT', liss: 'Aeróbico leve', circuito: 'Circuito' } as const

export function Treino() {
  const { key } = useParams()
  const profile = useProfile()
  const program = useProgram()
  const env = useEnvironment(profile?.activeEnvironmentId)
  const live = useLive()
  const [swapIndex, setSwapIndex] = useState<number | null>(null)
  if (!profile || !program || env === undefined) return <Loading />

  const session = program.sessions.find((s) => s.key === key)
  if (!session) return <ScreenHeader back title="Treino não encontrado" />

  const ctx = { profile, available: new Set(env?.equipment ?? []), exercises: EXERCISES, seed: program.seed }
  const swapping = swapIndex === null ? null : session.strength[swapIndex]
  const options = swapping
    ? alternatives(swapping.exerciseId, swapping.slot, swapping.priority, ctx, session.strength.map((x) => x.exerciseId)).slice(0, 8)
    : []

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader back eyebrow={`Treino ${session.key} · ${SPLIT_LABELS[program.split]}`} title={session.title} right={env && <span className="chip">{env.name}</span>} />
      <p className="-mt-2 text-xs text-muted">
        {session.subtitle} · {session.estimatedMinutes} min · ~{session.kcal} kcal
      </p>

      <Block color="mob" title={`Mobilidade · ${blockMinutes(session.mobility, 15)} min`} note="aquecimento">
        {session.mobility.map((x) => (
          <ExerciseRow key={x.exerciseId} planned={x} accent="mob" />
        ))}
      </Block>

      <Block color="lime" title={`Musculação · ${blockMinutes(session.strength)} min`} note="toque para ver detalhes">
        {session.strength.map((x, i) => (
          <ExerciseRow key={`${x.exerciseId}-${i}`} planned={x} accent="lime" onSwap={() => setSwapIndex(i)} />
        ))}
      </Block>

      {session.cardio && (
        <Block color="cardio" title={`${CARDIO_TITLE[session.cardio.kind]} · ${session.cardio.minutes} min`} note={GOAL_LABELS[profile.goal].toLowerCase()}>
          <div className="rounded-2xl border border-line bg-card p-3.5">
            <div className="text-sm font-bold">{session.cardio.exerciseIds.map(exerciseName).join(' · ')}</div>
            <div className="mt-1 text-xs leading-relaxed text-muted">{session.cardio.description}</div>
          </div>
        </Block>
      )}

      <Link to={`/aovivo/${session.key}`} className="btn btn-lime">
        {live?.sessionKey === session.key ? 'Continuar treino' : 'Começar treino'}
      </Link>

      {swapping && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60" onClick={() => setSwapIndex(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Trocar exercício"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[75vh] w-full max-w-[480px] flex-col gap-3 overflow-y-auto rounded-t-[28px] border border-line bg-bg p-5"
            style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="eyebrow">Trocar</div>
            <h2 className="font-display text-lg font-bold">{exerciseName(swapping.exerciseId)}</h2>
            {options.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma alternativa cabe neste ambiente. Marque mais equipamentos em Ambientes.</p>
            ) : (
              options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={async () => {
                    await swapExercise(session.key, swapIndex!, o.id)
                    setSwapIndex(null)
                  }}
                  className="cursor-pointer rounded-2xl border border-line bg-card p-3.5 text-left text-sm font-bold"
                >
                  {o.name}
                </button>
              ))
            )}
            <button type="button" className="btn btn-ghost mt-1" onClick={() => setSwapIndex(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Block({ color, title, note, children }: { color: 'lime' | 'mob' | 'cardio'; title: string; note: string; children: ReactNode }) {
  const text = { lime: 'text-lime', mob: 'text-mob', cardio: 'text-cardio' }[color]
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className={`flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] uppercase ${text}`}>
          <Dot color={color} /> {title}
        </h2>
        <span className="text-xs text-muted">{note}</span>
      </div>
      {children}
    </section>
  )
}
