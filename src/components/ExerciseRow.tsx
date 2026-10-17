import { Link } from 'react-router-dom'
import { EXERCISE_BY_ID, imageUrl } from '../data/catalog'
import type { PlannedExercise } from '../types'

export function prescriptionText(x: PlannedExercise): string {
  const range = x.repsMin === x.repsMax ? `${x.repsMax}` : `${x.repsMin}–${x.repsMax}`
  const unit = x.unit === 'seg' ? ' s' : ''
  const rest = x.restSec ? ` · ${x.restSec} s descanso` : ''
  const load = x.loadKg ? ` · ${String(x.loadKg).replace('.', ',')} kg` : ''
  return `${x.sets} × ${range}${unit}${load}${rest}`
}

export function ExerciseRow({
  planned,
  accent,
  onSwap,
}: {
  planned: PlannedExercise
  accent: 'lime' | 'mob'
  onSwap?: () => void
}) {
  const ex = EXERCISE_BY_ID.get(planned.exerciseId)
  const thumb = ex?.images[0]
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
      <Link to={`/exercicio/${planned.exerciseId}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-card2">
          {thumb ? (
            <img src={imageUrl(thumb)} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span className={`font-mono text-[11px] ${accent === 'lime' ? 'text-lime' : 'text-mob'}`}>
              {(ex?.name ?? '?').slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm leading-snug font-bold">{ex?.name ?? planned.exerciseId}</div>
          <div className="mt-0.5 font-mono text-xs text-muted">{prescriptionText(planned)}</div>
        </div>
      </Link>
      {onSwap && (
        <button
          type="button"
          onClick={onSwap}
          aria-label={`Trocar ${ex?.name ?? 'exercício'}`}
          className="shrink-0 cursor-pointer rounded-[10px] border border-line px-2 py-1.5 text-[11px] font-bold text-muted"
        >
          ⇄ trocar
        </button>
      )}
    </div>
  )
}
