import { Link } from 'react-router-dom'
import { exerciseName } from '../data/catalog'
import { liveElapsedMs } from '../engine/history'
import { useLive } from '../state/hooks'
import { formatClock, useTick } from './Timer'

/** Barra fixa acima das abas enquanto há treino em andamento: mostra onde parou e volta ao treino com um toque. */
export function LiveBar() {
  const live = useLive()
  const now = useTick(!!live && !live.pausedAt, 1000)
  if (!live) return null

  const { session } = live
  const steps = (session.mobility.length ? 1 : 0) + session.strength.length + (session.cardio ? 1 : 0)
  const strengthIndex = live.step - (session.mobility.length ? 1 : 0)
  const current =
    strengthIndex < 0
      ? 'Aquecimento'
      : strengthIndex >= session.strength.length
        ? 'Aeróbico'
        : exerciseName(session.strength[strengthIndex].exerciseId)
  const paused = !!live.pausedAt

  return (
    <Link
      to={`/aovivo/${session.key}`}
      aria-label={`Voltar ao treino ${session.title}`}
      className="mx-2 mb-2 flex items-center gap-3 rounded-2xl border border-lime/40 bg-card2 p-3 active:scale-[0.99]"
    >
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime text-lime-ink" aria-hidden="true">
        {paused ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
          </svg>
        ) : (
          <>
            <span className="absolute inset-0 animate-ping rounded-xl bg-lime/40" />
            <svg viewBox="0 0 24 24" className="relative h-4 w-4" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold tracking-[0.08em] text-lime uppercase">
          {paused ? 'Treino pausado' : 'Treino em andamento'} · {Math.min(live.step + 1, steps)}/{steps}
        </span>
        <span className="block truncate text-sm font-bold">{current}</span>
      </span>
      <span className={`shrink-0 font-mono text-sm tabular-nums ${paused ? 'text-cardio' : 'text-fg'}`}>
        {formatClock(liveElapsedMs(live, paused ? live.pausedAt : now) / 1000)}
      </span>
    </Link>
  )
}
