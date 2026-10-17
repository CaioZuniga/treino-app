import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExerciseRow } from '../components/ExerciseRow'
import { Dot, Loading, ScreenHeader } from '../components/ui'
import { EXERCISES, exerciseName } from '../data/catalog'
import { GOAL_LABELS } from '../data/labels'
import { alternatives, SPLIT_LABELS } from '../engine'
import { blockMinutes, groupIndexes } from '../engine/session'
import { currentCycle, sessionForToday, swapExercise, toggleSuperset } from '../state/actions'
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

  const planned = program.sessions.find((s) => s.key === key)
  if (!planned) return <ScreenHeader back title="Treino não encontrado" />
  const cycle = currentCycle(program, profile)
  const session = sessionForToday(planned, cycle)

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
      {cycle?.deload && (
        <p className="-mt-2 rounded-2xl border border-cardio/40 bg-cardio/10 p-3 text-xs leading-relaxed">
          <b className="text-cardio">Semana de deload:</b> menos séries e cargas 10% mais leves. O treino ao vivo já sugere as cargas certas.
        </p>
      )}

      <Block color="mob" title={`Mobilidade · ${blockMinutes(session.mobility, 15)} min`} note="aquecimento">
        {session.mobility.map((x) => (
          <ExerciseRow key={x.exerciseId} planned={x} accent="mob" />
        ))}
      </Block>

      <Block color="lime" title={`Musculação · ${blockMinutes(session.strength)} min`} note="toque para ver detalhes">
        {groupIndexes(session.strength).map((idx, g, groups) => {
          const last = idx[idx.length - 1]
          const canJoinNext = g < groups.length - 1 && idx.length === 1 && groups[g + 1].length === 1
          return (
            <div key={idx.join('-')} className="flex flex-col gap-2">
              {idx.length > 1 ? (
                <div className="flex flex-col gap-2 rounded-[20px] border border-lime/35 bg-lime/[0.04] p-2">
                  <div className="flex items-center justify-between px-1.5 pt-0.5">
                    <span className="text-[11px] font-bold tracking-[0.08em] text-lime uppercase">Supersérie</span>
                    <button type="button" onClick={() => toggleSuperset(session.key, idx[0])} className="cursor-pointer text-[11px] font-semibold text-muted">
                      Separar
                    </button>
                  </div>
                  {idx.map((i) => (
                    <ExerciseRow key={`${session.strength[i].exerciseId}-${i}`} planned={session.strength[i]} accent="lime" onSwap={() => setSwapIndex(i)} />
                  ))}
                </div>
              ) : (
                <ExerciseRow planned={session.strength[idx[0]]} accent="lime" onSwap={() => setSwapIndex(idx[0])} />
              )}
              {canJoinNext && (
                <button
                  type="button"
                  onClick={() => toggleSuperset(session.key, last)}
                  className="-my-1 cursor-pointer self-center rounded-full px-3 py-1 text-[11px] font-semibold text-dim"
                >
                  + juntar com o próximo em supersérie
                </button>
              )}
            </div>
          )
        })}
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
