import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loading, ScreenHeader } from '../components/ui'
import { exerciseName } from '../data/catalog'
import { bestLoad, formatVolume, loadSeries, trackedExercises, volumeKg } from '../engine/history'
import { useLogs } from '../state/hooks'

const kg = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

export function Progresso() {
  const logs = useLogs()
  const [selected, setSelected] = useState<string | null>(null)
  if (!logs) return <Loading />

  if (logs.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader eyebrow="Evolução" title="Progresso" />
        <div className="card flex flex-col gap-3">
          <h2 className="font-display text-[15px] font-medium">Seu primeiro treino aparece aqui</h2>
          <p className="text-sm leading-relaxed text-muted">
            Registre as séries no modo ao vivo. Depois de alguns treinos você vê a evolução da carga, o volume e os recordes.
          </p>
          <Link to="/" className="btn btn-lime">
            Ir para o treino de hoje
          </Link>
        </div>
      </div>
    )
  }

  const tracked = trackedExercises(logs)
  const current = selected && tracked.includes(selected) ? selected : tracked[0]
  const totalVolume = logs.reduce((t, l) => t + volumeKg(l), 0)
  const totalMin = logs.reduce((t, l) => t + l.durationMin, 0)
  const cardioMin = logs.reduce((t, l) => t + l.cardioMinutes, 0)
  const records = tracked
    .map((id) => ({ id, best: bestLoad(logs.flatMap((l) => l.sets.filter((s) => s.exerciseId === id))) }))
    .sort((a, b) => b.best - a.best)
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader eyebrow="Evolução" title="Progresso" />

      <div className="grid grid-cols-3 gap-2.5">
        <Stat value={String(logs.length)} label="treinos" />
        <Stat value={formatVolume(totalVolume)} label="volume total" />
        <Stat value={`${Math.floor(totalMin / 60)}h${String(totalMin % 60).padStart(2, '0')}`} label={`${cardioMin} min de aeróbico`} />
      </div>

      {current && (
        <div className="card flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Exercício do gráfico">
            {tracked.slice(0, 6).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={id === current}
                onClick={() => setSelected(id)}
                className={`chip cursor-pointer ${id === current ? 'chip-on' : ''}`}
              >
                {exerciseName(id)}
              </button>
            ))}
          </div>
          <LoadChart points={loadSeries(logs, current)} />
        </div>
      )}

      {records.length > 0 && (
        <div className="card flex flex-col">
          <h2 className="mb-1.5 font-display text-[15px] font-medium">Maiores cargas</h2>
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm last:border-0">
              <span>{exerciseName(r.id)}</span>
              <span className="font-mono text-lime">{kg(r.best)} kg</span>
            </div>
          ))}
        </div>
      )}

      <div className="card flex flex-col">
        <h2 className="mb-1.5 font-display text-[15px] font-medium">Histórico</h2>
        {[...logs]
          .reverse()
          .slice(0, 12)
          .map((l) => (
            <Link key={l.id} to={`/resumo/${l.id}`} className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm last:border-0">
              <span>
                <span className="block font-bold">{l.sessionTitle}</span>
                <span className="text-xs text-muted">{new Date(l.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </span>
              <span className="font-mono text-xs text-muted">
                {l.durationMin} min · {formatVolume(volumeKg(l))}
              </span>
            </Link>
          ))}
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-card p-3">
      <b className="block font-display text-[19px] font-medium tabular-nums">{value}</b>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  )
}

/** Carga máxima por sessão: linha com área, grade leve e o último ponto destacado. */
function LoadChart({ points }: { points: { date: string; loadKg: number }[] }) {
  if (points.length < 2) {
    return <p className="py-6 text-center text-sm text-muted">Faça mais uma sessão deste exercício para ver a curva.</p>
  }
  const W = 320
  const H = 170
  const pad = { l: 34, r: 14, t: 14, b: 26 }
  const values = points.map((p) => p.loadKg)
  const step = 5
  const min = Math.max(0, Math.floor(Math.min(...values) / step) * step - step)
  const max = Math.ceil(Math.max(...values) / step) * step
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (points.length - 1)
  const y = (v: number) => pad.t + ((max - v) * (H - pad.t - pad.b)) / Math.max(1, max - min)
  const ticks = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step).filter((_, i, a) => a.length <= 6 || i % 2 === 0)
  const line = points.map((p, i) => `${x(i)},${y(p.loadKg)}`).join(' ')
  const area = `${x(0)},${y(min)} ${line} ${x(points.length - 1)},${y(min)}`
  const labelEvery = Math.ceil(points.length / 6)
  const delta = values.at(-1)! - values[0]

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex items-baseline justify-between text-xs text-muted">
        <span>Carga máxima por treino (kg)</span>
        <span className={`font-mono ${delta >= 0 ? 'text-lime' : 'text-cardio'}`}>
          {delta >= 0 ? '+' : ''}
          {kg(delta)} kg
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Carga de ${kg(values[0])} a ${kg(values.at(-1)!)} kg em ${points.length} treinos`}>
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-lime)" stopOpacity=".35" />
            <stop offset="1" stopColor="var(--color-lime)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" />
            <text x={pad.l - 6} y={y(v) + 4} fill="var(--color-dim)" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono, monospace">
              {v}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text key={p.date} x={x(i)} y={H - 8} fill="var(--color-dim)" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
              {p.date.slice(8, 10)}/{p.date.slice(5, 7)}
            </text>
          ) : null,
        )}
        <polygon points={area} fill="url(#area)" />
        <polyline points={line} fill="none" stroke="var(--color-lime)" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={x(points.length - 1)} cy={y(values.at(-1)!)} r="5" fill="var(--color-lime)" />
      </svg>
    </figure>
  )
}
